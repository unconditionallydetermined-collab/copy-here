package com.careersync.service;

import com.careersync.model.AiAnalysis;
import com.careersync.repository.AiAnalysisRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class AiService {

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    @Value("${gemini.api.url}")
    private String geminiApiUrl;

    private final AiAnalysisRepository aiAnalysisRepository;
    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    public AiService(AiAnalysisRepository aiAnalysisRepository) {
        this.aiAnalysisRepository = aiAnalysisRepository;
        this.webClient = WebClient.builder().build();
        this.objectMapper = new ObjectMapper();
    }

    public String callGemini(String prompt) {
        if (geminiApiKey == null || geminiApiKey.isBlank()
                || geminiApiKey.equals("your-gemini-api-key")) {
            throw new IllegalStateException(
                    "AI is not configured on the server. Add a valid GEMINI_API_KEY in the backend environment settings.");
        }

        String configuredUrl = (geminiApiUrl == null || geminiApiUrl.isBlank())
                ? "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent"
                : geminiApiUrl.trim();
        List<String> targetUrls = new ArrayList<>();
        targetUrls.add(configuredUrl);
        if (!configuredUrl.contains("gemini-3.5-flash-lite")) {
            targetUrls.add("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent");
        }

        Integer lastStatus = null;
        for (String endpoint : targetUrls) {
            try {
                String url = endpoint + (endpoint.contains("?") ? "&" : "?") + "key=" + geminiApiKey;
                Map<String, Object> requestBody = Map.of(
                    "contents", List.of(Map.of(
                        "parts", List.of(Map.of("text", prompt))
                    ))
                );

                String response = webClient.post()
                        .uri(url)
                        .header("Content-Type", "application/json")
                        .bodyValue(objectMapper.writeValueAsString(requestBody))
                        .retrieve()
                        .bodyToMono(String.class)
                        .block();

                if (response != null && !response.isBlank()) {
                    JsonNode responseNode = objectMapper.readTree(response);
                    JsonNode candidates = responseNode.path("candidates");
                    if (candidates.isArray() && !candidates.isEmpty()) {
                        JsonNode parts = candidates.get(0).path("content").path("parts");
                        if (parts.isArray() && !parts.isEmpty()) {
                            String text = parts.get(0).path("text").asText("");
                            if (!text.isBlank()) return convertNumberedListsToBullets(text);
                        }
                    }
                }
            } catch (org.springframework.web.reactive.function.client.WebClientResponseException e) {
                lastStatus = e.getStatusCode().value();
            } catch (Exception e) {
                // Try the supported fallback model without exposing provider details or the API key.
            }
        }

        String detail = lastStatus == null ? "The provider could not be reached."
                : "The provider returned HTTP " + lastStatus + ".";
        throw new IllegalStateException("Gemini could not generate a response. " + detail
                + " Check GEMINI_API_KEY and GEMINI_API_URL in the backend environment settings.");
    }

    private String convertNumberedListsToBullets(String text) {
        String[] lines = text.split("\n");
        StringBuilder sb = new StringBuilder();
        for (String line : lines) {
            if (line.matches("^\\s*\\d+\\.\\s+.*")) {
                sb.append(line.replaceFirst("^\\s*\\d+\\.\\s+", "- ")).append("\n");
            } else {
                sb.append(line).append("\n");
            }
        }
        return sb.toString().trim();
    }

    private String getMockResponse(String prompt) {
        String lower = prompt.toLowerCase();
        if (lower.contains("resume")) {
            // Generate tailored response based on keywords detected in prompt
            String skillsNote = "- Demonstrated knowledge in foundational computer science concepts";
            if (lower.contains("react") || lower.contains("frontend") || lower.contains("javascript")) {
                skillsNote = "- Strong modern frontend profile with React and JavaScript";
            } else if (lower.contains("java") || lower.contains("spring") || lower.contains("backend")) {
                skillsNote = "- Solid enterprise backend foundation with Java and Spring Boot ecosystem";
            } else if (lower.contains("python")) {
                skillsNote = "- Practical Python development and scripting capabilities";
            }

            return "## Resume Analysis\n\n" +
                   "**Strengths:**\n" +
                   skillsNote + "\n" +
                   "- Clear project technical stack and implementation highlights\n" +
                   "- Relevant academic and problem-solving background\n\n" +
                   "**Areas for Improvement:**\n" +
                   "- Add quantifiable metrics and business impact to projects (e.g. latency, user scale)\n" +
                   "- Include targeted keywords aligned with your desired job descriptions\n" +
                   "- Add a concise 2-3 line professional executive summary at the top\n\n" +
                   "**Recommendations:**\n" +
                   "- Add live deployment URLs and active GitHub repository links for every listed project\n" +
                   "- Structure bullet points using the Google XYZ formula: Accomplished [X], as measured by [Y], by doing [Z]\n" +
                   "- Highlight cloud experience, CI/CD pipeline usage, and automated testing\n\n" +
                   "**Overall Score:**\n" +
                   "- 8.2 / 10 - Strong technical foundation with excellent potential for high-impact roles";
        } else if (lower.contains("skill gap") || lower.contains("job description")) {
            return "## Skill Gap Analysis\n\n" +
                   "**Matched Skills:**\n" +
                   "- Core Programming & Software Engineering Principles\n" +
                   "- Web API Design and Implementation\n" +
                   "- Database modeling and query optimization\n\n" +
                   "**Identified Missing Skills:**\n" +
                   "- Container orchestration with Docker & Kubernetes\n" +
                   "- Cloud platform deployment (AWS/GCP/Azure)\n" +
                   "- System Design, distributed caching, and microservices architecture\n\n" +
                   "**Recommended Learning Path:**\n" +
                   "- Master Docker containerization fundamentals (Estimated: 2 weeks)\n" +
                   "- Study System Design and caching strategies with Redis (Estimated: 3 weeks)\n" +
                   "- Deploy projects to AWS or GCP with automated CI/CD pipelines (Estimated: 4 weeks)";
        } else {
            return "## Career Recommendations\n\n" +
                   "**Strategic Career Priorities:**\n" +
                   "- Build 2-3 end-to-end fullstack production applications with real users\n" +
                   "- Practice data structures & algorithms consistently on LeetCode/CodeForces\n" +
                   "- Obtain recognized cloud certification to validate practical architecture skills\n" +
                   "- Connect actively with engineering managers and technical recruiters on LinkedIn\n" +
                   "- Track and target 5-10 tailored job applications each week";
        }
    }

    public AiAnalysis reviewResume(String userId, String resumeText) {
        String prompt = String.format(
            "You are an expert career counselor and senior technical recruiter. Analyze the following candidate resume thoroughly and provide detailed, actionable, and personalized feedback.\n\n" +
            "Candidate Resume Content:\n%s\n\n" +
            "CRITICAL FORMATTING INSTRUCTIONS:\n" +
            "- Format ALL list items using circle bullet points ('- ').\n" +
            "- Do NOT use numbers (like 1., 2., 3.) anywhere in your response, including the recommendations.\n" +
            "- Every single recommendation and suggestion must start with '- '.\n\n" +
            "Please structure your response with these exact sections:\n" +
            "## Strengths\n" +
            "- [Specific strength with details]\n\n" +
            "## Areas for Improvement\n" +
            "- [Specific constructive critique]\n\n" +
            "## Missing Keywords\n" +
            "- [Industry keywords that would improve ATS pass rate]\n\n" +
            "## Actionable Recommendations\n" +
            "- [Clear next step to improve resume impact]\n\n" +
            "## Overall Score\n" +
            "- [Score out of 10 and summary assessment]",
            resumeText
        );

        String result = callGemini(prompt);
        AiAnalysis analysis = new AiAnalysis();
        analysis.setUserId(userId);
        analysis.setAnalysisType("RESUME_REVIEW");
        analysis.setInputData(resumeText.substring(0, Math.min(500, resumeText.length())));
        analysis.setResult(result);
        analysis.setCreatedAt(LocalDateTime.now());
        return aiAnalysisRepository.save(analysis);
    }

    public AiAnalysis analyzeSkillGap(String userId, String jobDescription, List<String> userSkills) {
        String prompt = String.format(
            "You are a senior technical recruiter. Analyze the skill gap between a job description and a candidate's skills.\n\n" +
            "Job Description:\n%s\n\n" +
            "Candidate's Current Skills: %s\n\n" +
            "CRITICAL: Use ONLY circle bullet points ('- ') for all points. Do not use numbered lists.\n\n" +
            "Provide:\n" +
            "## Matched Skills\n" +
            "- Skills the candidate has that match the role\n\n" +
            "## Missing Skills\n" +
            "- Skills required that the candidate is missing\n\n" +
            "## Priority Learning Path\n" +
            "- Specific skills to learn in priority order\n\n" +
            "## Estimated Timeline & Resources\n" +
            "- Timeframe and curated learning resources",
            jobDescription, String.join(", ", userSkills)
        );

        String result = callGemini(prompt);
        AiAnalysis analysis = new AiAnalysis();
        analysis.setUserId(userId);
        analysis.setAnalysisType("SKILL_GAP");
        analysis.setInputData(jobDescription.substring(0, Math.min(500, jobDescription.length())));
        analysis.setResult(result);
        analysis.setCreatedAt(LocalDateTime.now());
        return aiAnalysisRepository.save(analysis);
    }

    public String chat(String userId, String message, String userContext) {
        String prompt = String.format(
            "You are an AI Career Assistant for a platform called Career Sync. You help students and job seekers with personalized career guidance.\n\nUser Profile Context:\n%s\n\nUser Question: %s\n\nProvide a helpful, encouraging, and specific answer based on the user's context. Format list items with bullet points (- ). Be concise but thorough.",
            userContext, message
        );

        String result = callGemini(prompt);

        AiAnalysis analysis = new AiAnalysis();
        analysis.setUserId(userId);
        analysis.setAnalysisType("CHAT");
        analysis.setInputData(message);
        analysis.setResult(result);
        analysis.setCreatedAt(LocalDateTime.now());
        aiAnalysisRepository.save(analysis);

        return result;
    }

    public List<AiAnalysis> getHistory(String userId) {
        return aiAnalysisRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }
}
