package com.careersync.controller;

import com.careersync.security.UserPrincipal;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.lang.management.ManagementFactory;
import java.util.*;

@RestController
@RequestMapping("/api/v1/debug")
public class DebugController {

    private static final Logger log = LoggerFactory.getLogger(DebugController.class);
    private static final long START_TIME_MS = System.currentTimeMillis();

    private final MongoTemplate mongoTemplate;

    @Value("${app.debug.admins:}")
    private String configuredDebugAdmins;

    @Value("${VITE_DEBUG_ADMINS:}")
    private String viteDebugAdmins;

    public DebugController(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @GetMapping("/health")
    public ResponseEntity<?> getDebugHealth(@AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null) {
            log.warn("GET /api/v1/debug/health: Unauthorized");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Unauthorized"));
        }

        // Verify admin permissions
        if (!isAdmin(principal.getEmail())) {
            log.warn("GET /api/v1/debug/health: Forbidden for email={}", principal.getEmail());
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Forbidden: Admin access required"));
        }

        log.info("GET /api/v1/debug/health accessed by admin email={}", principal.getEmail());

        Map<String, Object> health = new LinkedHashMap<>();
        health.put("appVersion", "1.0.0");
        health.put("uptimeSeconds", (System.currentTimeMillis() - START_TIME_MS) / 1000);
        health.put("jvmUptimeMs", ManagementFactory.getRuntimeMXBean().getUptime());

        // Test DB connectivity
        boolean dbConnected = false;
        String dbError = null;
        try {
            mongoTemplate.getDb().runCommand(new org.bson.Document("ping", 1));
            dbConnected = true;
        } catch (Exception e) {
            dbError = e.getMessage();
            log.error("Database health check ping failed: {}", e.getMessage());
        }

        Map<String, Object> dbStatus = new LinkedHashMap<>();
        dbStatus.put("connected", dbConnected);
        if (dbError != null) {
            dbStatus.put("error", dbError);
        }
        health.put("database", dbStatus);

        // Env vars status (true / false presence only, never values)
        Map<String, Boolean> envFlags = new LinkedHashMap<>();
        envFlags.put("MONGODB_URI", isEnvPresent("MONGODB_URI"));
        envFlags.put("SUPABASE_URL", isEnvPresent("SUPABASE_URL"));
        envFlags.put("SUPABASE_ANON_KEY", isEnvPresent("SUPABASE_ANON_KEY"));
        envFlags.put("SUPABASE_JWT_SECRET", isEnvPresent("SUPABASE_JWT_SECRET"));
        envFlags.put("GEMINI_API_KEY", isEnvPresent("GEMINI_API_KEY"));
        envFlags.put("CORS_ALLOWED_ORIGINS", isEnvPresent("CORS_ALLOWED_ORIGINS"));
        envFlags.put("DEBUG_ADMINS", isEnvPresent("DEBUG_ADMINS") || isEnvPresent("VITE_DEBUG_ADMINS"));
        health.put("environmentVariablesSet", envFlags);

        return ResponseEntity.ok(health);
    }

    private boolean isEnvPresent(String name) {
        String val = System.getenv(name);
        if (val == null || val.isBlank()) {
            val = System.getProperty(name);
        }
        return val != null && !val.isBlank();
    }

    private boolean isAdmin(String email) {
        if (email == null || email.isBlank()) return false;
        String combined = (configuredDebugAdmins + "," + viteDebugAdmins + "," + System.getenv("DEBUG_ADMINS")).toLowerCase();
        List<String> adminList = Arrays.stream(combined.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();

        // If no admins are configured, allow authenticated users in development mode or check if email matches
        if (adminList.isEmpty()) {
            return true;
        }
        return adminList.contains(email.toLowerCase().trim());
    }
}
