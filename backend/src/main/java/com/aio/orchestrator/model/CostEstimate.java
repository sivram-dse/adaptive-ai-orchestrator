package com.aio.orchestrator.model;

public record CostEstimate(
        ExecutionStrategy strategy,
        double estimatedUsd,
        int estimatedLatencyMs,
        int estimatedTokens,
        double estimatedConfidence
) {
}
