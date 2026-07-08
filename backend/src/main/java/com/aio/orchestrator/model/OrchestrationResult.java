package com.aio.orchestrator.model;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public record OrchestrationResult(
        String requestId,
        String correlationId,
        ExecutionStrategy strategy,
        String output,
        double confidence,
        int latencyMs,
        int tokenUsage,
        double estimatedUsd,
        double actualUsd,
        int retryCount,
        boolean success,
        String rationale,
        List<ExecutionStrategy> evaluatedStrategies,
        Map<ExecutionStrategy, Double> decisionScores,
        Instant executedAt
) {
}
