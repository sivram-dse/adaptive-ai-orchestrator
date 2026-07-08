package com.aio.orchestrator.telemetry.trace;

public record ExecutionTraceMetrics(
        long totalRequests,
        double averageCost,
        double averageLatencyMs,
        double averageTokens,
        double averageConfidence,
        double successRate,
        double failureRate,
        double savingsVsAlwaysAgent
) {
}
