package com.aio.orchestrator.analytics;

public record ExecutionAnalyticsSummary(
        long totalRequests,
        double averageCost,
        double averageLatencyMs,
        double averageTokens,
        double averageConfidence,
        double successRate,
        double failureRate,
        double skillUsagePct,
        double agentUsagePct,
        double codeUsagePct,
        double llmUsagePct,
        double savingsVsAlwaysAgent
) {
}
