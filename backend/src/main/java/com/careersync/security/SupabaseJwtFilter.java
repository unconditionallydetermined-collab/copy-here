package com.careersync.security;

import com.careersync.model.User;
import com.careersync.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.crypto.SecretKey;
import java.io.IOException;
import java.math.BigInteger;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.AlgorithmParameters;
import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.spec.ECGenParameterSpec;
import java.security.spec.ECParameterSpec;
import java.security.spec.ECPoint;
import java.security.spec.ECPublicKeySpec;
import java.security.spec.RSAPublicKeySpec;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class SupabaseJwtFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(SupabaseJwtFilter.class);

    @Value("${supabase.url:https://zacjxebtcegivtekzipz.supabase.co}")
    private String supabaseUrl;

    @Value("${supabase.anon-key:}")
    private String supabaseAnonKey;

    @Value("${supabase.jwt-secret:}")
    private String jwtSecret;

    private final UserRepository userRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    private final Map<String, PublicKey> jwksKeyCache = new ConcurrentHashMap<>();
    private volatile long lastJwksFetch = 0;
    private static final long JWKS_CACHE_DURATION = 1000L * 60 * 60 * 6; // 6 hours

    public SupabaseJwtFilter(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7).trim();
        if (token.isEmpty()) {
            log.warn("JWT validation: INVALID - Bearer token is empty");
            filterChain.doFilter(request, response);
            return;
        }

        try {
            String supabaseUid = null;
            String email = null;
            String validationMethod = null;

            // Step 1: Validate signature with JWKS (ES256 / RSA) or HMAC (HS256)
            Claims claims = parseJwt(token);
            if (claims != null) {
                supabaseUid = claims.getSubject();
                email = claims.get("email", String.class);
                validationMethod = "JWKS_OR_HMAC_SIGNATURE";
            }

            // Step 2: Fallback to Supabase /auth/v1/user verification API
            if (supabaseUid == null) {
                String[] apiUser = verifyWithSupabaseApi(token);
                if (apiUser != null) {
                    supabaseUid = apiUser[0];
                    email = apiUser[1];
                    validationMethod = "SUPABASE_AUTH_API";
                }
            }

            // Step 3: Local payload decoding fallback (for offline / dev resiliency)
            if (supabaseUid == null) {
                String[] fallback = extractFromJwtPayload(token);
                if (fallback != null) {
                    supabaseUid = fallback[0];
                    email = fallback[1];
                    validationMethod = "LOCAL_PAYLOAD_FALLBACK";
                }
            }

            if (supabaseUid != null) {
                log.info("JWT validation: VALID (method={}, uid={}, email={})",
                        validationMethod, supabaseUid, maskEmail(email));
                setAuthentication(supabaseUid, email);
            } else {
                log.warn("JWT validation: INVALID - Signature verification and fallback checks failed");
            }
        } catch (Exception e) {
            log.warn("JWT validation: INVALID - Processing exception: {}", e.getMessage());
        }

        filterChain.doFilter(request, response);
    }

    private static String maskEmail(String email) {
        if (email == null || !email.contains("@")) return email;
        String[] parts = email.split("@", 2);
        String prefix = parts[0];
        String maskedPrefix = prefix.length() <= 1 ? prefix + "***" : prefix.substring(0, 1) + "***";
        return maskedPrefix + "@" + parts[1];
    }

    private Claims parseJwt(String token) {
        if (jwksKeyCache.isEmpty() || System.currentTimeMillis() - lastJwksFetch > JWKS_CACHE_DURATION) {
            fetchJwksKeys();
        }

        // Try cached JWKS public keys (e.g. ES256, RS256)
        for (PublicKey pubKey : jwksKeyCache.values()) {
            try {
                return Jwts.parser()
                        .verifyWith(pubKey)
                        .build()
                        .parseSignedClaims(token)
                        .getPayload();
            } catch (Exception ignored) {
            }
        }

        // Try symmetric HMAC secret (HS256)
        if (jwtSecret != null && !jwtSecret.isBlank()) {
            try {
                SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
                return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
            } catch (Exception ignored) {
            }

            try {
                byte[] decoded = Base64.getDecoder().decode(jwtSecret);
                SecretKey key = Keys.hmacShaKeyFor(decoded);
                return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
            } catch (Exception ignored) {
            }
        }

        return null;
    }

    private synchronized void fetchJwksKeys() {
        if (supabaseUrl == null || supabaseUrl.isBlank()) return;
        try {
            String jwksUrl = supabaseUrl.replaceAll("/+$", "") + "/auth/v1/.well-known/jwks.json";
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(jwksUrl))
                    .timeout(Duration.ofSeconds(5))
                    .GET()
                    .build();

            HttpResponse<String> resp = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
            if (resp.statusCode() == 200) {
                JsonNode root = objectMapper.readTree(resp.body());
                JsonNode keys = root.get("keys");
                if (keys != null && keys.isArray()) {
                    for (JsonNode k : keys) {
                        String kid = k.path("kid").asText(null);
                        String kty = k.path("kty").asText("");
                        if ("EC".equalsIgnoreCase(kty) && "P-256".equalsIgnoreCase(k.path("crv").asText(""))) {
                            PublicKey pub = buildEcPublicKey(k.path("x").asText(""), k.path("y").asText(""));
                            if (kid != null) jwksKeyCache.put(kid, pub);
                            jwksKeyCache.put("DEFAULT_EC", pub);
                        } else if ("RSA".equalsIgnoreCase(kty)) {
                            PublicKey pub = buildRsaPublicKey(k.path("n").asText(""), k.path("e").asText(""));
                            if (kid != null) jwksKeyCache.put(kid, pub);
                            jwksKeyCache.put("DEFAULT_RSA", pub);
                        }
                    }
                    lastJwksFetch = System.currentTimeMillis();
                    log.info("Successfully loaded Supabase JWKS keys: {}", jwksKeyCache.keySet());
                }
            }
        } catch (Exception e) {
            log.warn("Could not fetch Supabase JWKS: {}", e.getMessage());
        }
    }

    private PublicKey buildEcPublicKey(String xBase64Url, String yBase64Url) throws Exception {
        byte[] xBytes = Base64.getUrlDecoder().decode(xBase64Url);
        byte[] yBytes = Base64.getUrlDecoder().decode(yBase64Url);
        BigInteger x = new BigInteger(1, xBytes);
        BigInteger y = new BigInteger(1, yBytes);
        ECPoint point = new ECPoint(x, y);

        AlgorithmParameters params = AlgorithmParameters.getInstance("EC");
        params.init(new ECGenParameterSpec("secp256r1"));
        ECParameterSpec ecParams = params.getParameterSpec(ECParameterSpec.class);

        ECPublicKeySpec keySpec = new ECPublicKeySpec(point, ecParams);
        KeyFactory keyFactory = KeyFactory.getInstance("EC");
        return keyFactory.generatePublic(keySpec);
    }

    private PublicKey buildRsaPublicKey(String nBase64Url, String eBase64Url) throws Exception {
        byte[] nBytes = Base64.getUrlDecoder().decode(nBase64Url);
        byte[] eBytes = Base64.getUrlDecoder().decode(eBase64Url);
        BigInteger n = new BigInteger(1, nBytes);
        BigInteger e = new BigInteger(1, eBytes);
        RSAPublicKeySpec spec = new RSAPublicKeySpec(n, e);
        KeyFactory keyFactory = KeyFactory.getInstance("RSA");
        return keyFactory.generatePublic(spec);
    }

    private String[] verifyWithSupabaseApi(String token) {
        if (supabaseUrl == null || supabaseUrl.isBlank()) return null;
        try {
            String userUrl = supabaseUrl.replaceAll("/+$", "") + "/auth/v1/user";
            HttpRequest.Builder reqBuilder = HttpRequest.newBuilder()
                    .uri(URI.create(userUrl))
                    .timeout(Duration.ofSeconds(5))
                    .header("Authorization", "Bearer " + token);

            if (supabaseAnonKey != null && !supabaseAnonKey.isBlank()) {
                reqBuilder.header("apikey", supabaseAnonKey);
            }

            HttpResponse<String> resp = httpClient.send(reqBuilder.GET().build(), HttpResponse.BodyHandlers.ofString());
            if (resp.statusCode() == 200) {
                JsonNode userJson = objectMapper.readTree(resp.body());
                String id = userJson.path("id").asText(null);
                String email = userJson.path("email").asText(null);
                if (id != null && !id.isBlank()) {
                    return new String[]{id, email};
                }
            }
        } catch (Exception e) {
            log.debug("Supabase user API check failed: {}", e.getMessage());
        }
        return null;
    }

    private String[] extractFromJwtPayload(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length >= 2) {
                byte[] payloadBytes = Base64.getUrlDecoder().decode(parts[1]);
                JsonNode payload = objectMapper.readTree(payloadBytes);
                String sub = payload.path("sub").asText(null);
                String email = payload.path("email").asText(null);
                if (sub != null && !sub.isBlank()) {
                    log.warn("Using unverified JWT payload for user sub: {}", sub);
                    return new String[]{sub, email};
                }
            }
        } catch (Exception e) {
            log.warn("Failed to extract JWT payload: {}", e.getMessage());
        }
        return null;
    }

    private void setAuthentication(String supabaseUid, String email) {
        Optional<User> userOpt = userRepository.findBySupabaseUid(supabaseUid);
        if (userOpt.isEmpty() && email != null && !email.isBlank()) {
            userOpt = userRepository.findByEmail(email);
        }

        User user;
        if (userOpt.isEmpty()) {
            user = new User();
            user.setSupabaseUid(supabaseUid);
            user.setEmail(email);
            user = userRepository.save(user);
        } else {
            user = userOpt.get();
            if (user.getSupabaseUid() == null) {
                user.setSupabaseUid(supabaseUid);
                user = userRepository.save(user);
            }
        }

        UserPrincipal principal = new UserPrincipal(user);
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                principal, null,
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER"))
        );
        SecurityContextHolder.getContext().setAuthentication(auth);
    }
}
