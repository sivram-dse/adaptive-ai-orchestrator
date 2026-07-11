package com.aio.orchestrator.decision.impl;

import com.aio.orchestrator.model.TaskComplexity;
import com.aio.orchestrator.model.UserRequest;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Component;

@Component
public class HeuristicComplexityClassifier implements com.aio.orchestrator.decision.ComplexityClassifier {

    private static final Set<String> LOW_SIGNAL = Set.of(
            "validate", "format", "json", "regex", "classify", "translate", "summarize"
    );
    private static final Set<String> MEDIUM_SIGNAL = Set.of(
            "sql", "analysis", "analyze", "financial", "finance", "revenue", "expense", "report", "research",
            "explain", "email"
    );
    private static final Set<String> HIGH_SIGNAL = Set.of(
            "plan", "architecture", "migration", "tool", "multi-step", "workflow", "agent", "strategic"
    );

    @Override
    public TaskComplexity classify(UserRequest request) {
        double score = complexityScore(request);
        if (score < 0.2d) {
            return TaskComplexity.TRIVIAL;
        }
        if (score < 0.38d) {
            return TaskComplexity.LOW;
        }
        if (score < 0.58d) {
            return TaskComplexity.MEDIUM;
        }
        if (score < 0.8d) {
            return TaskComplexity.HIGH;
        }
        return TaskComplexity.CRITICAL;
    }

    public double complexityScore(UserRequest request) {
        Map<String, String> metadata = request.metadata() == null ? Map.of() : request.metadata();
        String rawPayload = request.payload() == null ? "" : request.payload();
        String payload = (String.join(" ", metadata.values()) + " " + rawPayload).toLowerCase(Locale.ROOT);
        int payloadSize = payload.length();
        double score = Math.min(0.35d, payloadSize / 8000d);
        score += keywordWeight(payload, LOW_SIGNAL, 0.01d);
        score += keywordWeight(payload, MEDIUM_SIGNAL, 0.12d);
        score += keywordWeight(payload, HIGH_SIGNAL, 0.20d);
        score += parseMetadata(request, "reasoningDepth", 0.30d);
        score += parseMetadata(request, "contextSize", 0.20d);
        score += parseMetadata(request, "memoryRequirement", 0.20d);
        score += parseMetadata(request, "externalTools", 0.15d);
        score += parseMetadata(request, "privacyLevel", 0.10d);
        return clamp(score);
    }

    private static double keywordWeight(String payload, Set<String> keywords, double eachWeight) {
        double weight = 0d;
        for (String keyword : keywords) {
            if (payload.contains(keyword)) {
                weight += eachWeight;
            }
        }
        return weight;
    }

    private static double parseMetadata(UserRequest request, String key, double weight) {
        Map<String, String> metadata = request.metadata() == null ? Map.of() : request.metadata();
        String value = metadata.getOrDefault(key, "0");
        try {
            double normalized = Math.max(0d, Math.min(1d, Double.parseDouble(value)));
            return normalized * weight;
        } catch (NumberFormatException ignored) {
            return 0d;
        }
    }

    private static double clamp(double value) {
        return Math.max(0d, Math.min(1d, value));
    }
}
