package com.aio.orchestrator.model;

import java.util.List;
import java.util.Map;

public record StrategyDecision(
        ExecutionStrategy selectedStrategy,
        TaskComplexity complexity,
        double complexityScore,
        AccuracyTarget accuracyTarget,
        CostEstimate costEstimate,
        List<ExecutionStrategy> evaluatedStrategies,
        Map<ExecutionStrategy, Double> strategyScores,
        String rationale
) {
}
