package com.aio.orchestrator.analytics;

import com.aio.orchestrator.model.ExecutionStrategy;

public record ScenarioBenchmarkResult(
        String scenarioId,
        String scenarioName,
        String prompt,
        String reasonForRouting,
        ExecutionStrategy routedStrategy,
        double estimatedCost,
        double actualCost,
        int estimatedLatencyMs,
        int actualLatencyMs,
        int tokens,
        double confidence,
        double savingsVsAlwaysAgent
) {
}
