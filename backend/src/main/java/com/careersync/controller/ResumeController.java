package com.careersync.controller;

import com.careersync.model.Resume;
import com.careersync.repository.ResumeRepository;
import com.careersync.security.UserPrincipal;
import com.careersync.service.AiService;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.*;
import java.util.regex.Pattern;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

@RestController
@RequestMapping("/api/v1/resume")
public class ResumeController {

    private final ResumeRepository resumeRepository;
    private final AiService aiService;

    public ResumeController(ResumeRepository resumeRepository, AiService aiService) {
        this.resumeRepository = resumeRepository;
        this.aiService = aiService;
    }

    @GetMapping
    public ResponseEntity<?> get(@AuthenticationPrincipal UserPrincipal p) {
        if (p == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User is not authenticated");
        }
        return resumeRepository.findTopByUserIdOrderByUploadedAtDesc(p.getUserId())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<?> handleMaxSizeException(MaxUploadSizeExceededException exc) {
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE)
                .body(Map.of("message", "File too large (max 10 MB)"));
    }

    @PostMapping("/upload")
    public ResponseEntity<?> upload(@AuthenticationPrincipal UserPrincipal p,
                                    @RequestParam("file") MultipartFile file) {
        if (p == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "User is not authenticated"));
        }
        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Please select a file to upload"));
        }

        try {
            String originalFilename = file.getOriginalFilename();
            String cleanName = (originalFilename != null && !originalFilename.isBlank())
                    ? Paths.get(originalFilename).getFileName().toString()
                    : "resume.pdf";

            String extractedText = extractTextInMemory(file, cleanName);

            if (extractedText == null || extractedText.trim().isEmpty()) {
                if (cleanName.toLowerCase().endsWith(".pdf")) {
                    return ResponseEntity.badRequest()
                            .body(Map.of("message", "This PDF looks scanned, so upload a text-based PDF"));
                } else {
                    return ResponseEntity.badRequest()
                            .body(Map.of("message", "No readable text found in file"));
                }
            }

            List<String> skills = extractSkills(extractedText);

            Resume resume = new Resume();
            resume.setUserId(p.getUserId());
            resume.setFileName(cleanName);
            resume.setFileUrl(null);
            resume.setExtractedText(extractedText);
            resume.setExtractedSkills(skills);
            resume.setUploadedAt(LocalDateTime.now());

            return ResponseEntity.ok(resumeRepository.save(resume));
        } catch (IOException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Failed to upload resume: " + e.getMessage()));
        }
    }

    /**
     * Extract text from a multipart file entirely in memory.
     * Avoids disk writes — safe for ephemeral cloud filesystems (Render, Railway, etc.)
     */
    private String extractTextInMemory(MultipartFile file, String cleanName) throws IOException {
        String lowerName = cleanName.toLowerCase();
        byte[] bytes = file.getBytes();

        if (lowerName.endsWith(".pdf")) {
            try (PDDocument doc = Loader.loadPDF(bytes)) {
                PDFTextStripper stripper = new PDFTextStripper();
                return stripper.getText(doc);
            } catch (Exception ex) {
                System.err.println("Warning: could not extract text from PDF: " + ex.getMessage());
                return "";
            }
        } else if (lowerName.endsWith(".docx")) {
            return extractDocxTextFromBytes(bytes);
        } else if (lowerName.endsWith(".txt")) {
            return new String(bytes, StandardCharsets.UTF_8);
        }
        return "";
    }

    private String extractDocxTextFromBytes(byte[] bytes) {
        try (ZipInputStream zis = new ZipInputStream(new java.io.ByteArrayInputStream(bytes))) {
            ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                if ("word/document.xml".equals(entry.getName())) {
                    String xml = new String(zis.readAllBytes(), StandardCharsets.UTF_8);
                    return xml.replaceAll("<[^>]+>", " ").replaceAll("\\s+", " ").trim();
                }
            }
        } catch (Exception e) {
            System.err.println("DOCX extraction error: " + e.getMessage());
        }
        return "";
    }

    private List<String> extractSkills(String text) {
        if (text == null || text.isBlank()) {
            return new ArrayList<>();
        }

        Map<String, String> skillPatterns = new LinkedHashMap<>();
        skillPatterns.put("Java", "\\bJava\\b");
        skillPatterns.put("Python", "\\bPython\\b");
        skillPatterns.put("JavaScript", "\\b(?:JavaScript|JS)\\b");
        skillPatterns.put("TypeScript", "\\b(?:TypeScript|TS)\\b");
        skillPatterns.put("C++", "(?:^|[\\s,;/()|])C\\+\\+(?:$|[\\s,;/()|])");
        skillPatterns.put("C", "(?:^|[\\s,;/()|])C(?:$|[\\s,;/()|])");
        skillPatterns.put("Go", "\\b(?:Go|Golang)\\b");
        skillPatterns.put("Rust", "\\bRust\\b");
        skillPatterns.put("Spring Boot", "\\bSpring\\s+Boot\\b");
        skillPatterns.put("Spring", "\\bSpring\\b");
        skillPatterns.put("React", "\\bReact(?:\\.js)?\\b");
        skillPatterns.put("Angular", "\\bAngular(?:\\.js)?\\b");
        skillPatterns.put("Vue", "\\bVue(?:\\.js)?\\b");
        skillPatterns.put("Node.js", "\\bNode(?:\\.js)?\\b");
        skillPatterns.put("Express", "\\bExpress(?:\\.js)?\\b");
        skillPatterns.put("MongoDB", "\\bMongo(?:DB)?\\b");
        skillPatterns.put("MySQL", "\\bMySQL\\b");
        skillPatterns.put("PostgreSQL", "\\b(?:PostgreSQL|Postgres)\\b");
        skillPatterns.put("Redis", "\\bRedis\\b");
        skillPatterns.put("Firebase", "\\bFirebase\\b");
        skillPatterns.put("AWS", "\\b(?:AWS|Amazon Web Services)\\b");
        skillPatterns.put("Azure", "\\bAzure\\b");
        skillPatterns.put("GCP", "\\b(?:GCP|Google Cloud)\\b");
        skillPatterns.put("Docker", "\\bDocker\\b");
        skillPatterns.put("Kubernetes", "\\b(?:Kubernetes|K8s)\\b");
        skillPatterns.put("Jenkins", "\\bJenkins\\b");
        skillPatterns.put("CI/CD", "\\bCI/CD\\b");
        skillPatterns.put("Git", "\\bGit\\b");
        skillPatterns.put("GitHub", "\\bGitHub\\b");
        skillPatterns.put("GitLab", "\\bGitLab\\b");
        skillPatterns.put("REST API", "\\bREST(?:ful)?(?:\\s+API)?\\b");
        skillPatterns.put("GraphQL", "\\bGraphQL\\b");
        skillPatterns.put("Microservices", "\\bMicroservices\\b");
        skillPatterns.put("HTML", "\\bHTML5?\\b");
        skillPatterns.put("CSS", "\\bCSS3?\\b");
        skillPatterns.put("Tailwind", "\\bTailwind(?:CSS)?\\b");
        skillPatterns.put("Bootstrap", "\\bBootstrap\\b");
        skillPatterns.put("Machine Learning", "\\bMachine\\s+Learning\\b");
        skillPatterns.put("Deep Learning", "\\bDeep\\s+Learning\\b");
        skillPatterns.put("TensorFlow", "\\bTensorFlow\\b");
        skillPatterns.put("PyTorch", "\\bPyTorch\\b");
        skillPatterns.put("DSA", "\\b(?:DSA|Data Structures|Algorithms)\\b");
        skillPatterns.put("System Design", "\\bSystem\\s+Design\\b");
        skillPatterns.put("SQL", "\\bSQL\\b");
        skillPatterns.put("Linux", "\\bLinux\\b");

        List<String> found = new ArrayList<>();
        for (Map.Entry<String, String> entry : skillPatterns.entrySet()) {
            Pattern p;
            if (entry.getKey().equals("C")) {
                p = Pattern.compile(entry.getValue());
            } else {
                p = Pattern.compile(entry.getValue(), Pattern.CASE_INSENSITIVE);
            }
            if (p.matcher(text).find()) {
                found.add(entry.getKey());
            }
        }
        return found;
    }
}
