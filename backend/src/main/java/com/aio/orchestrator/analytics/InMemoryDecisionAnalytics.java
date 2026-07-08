package com.aio.orchestrator.analytics;

import com.aio.orchestrator.model.ExecutionStrategy;
import com.aio.orchestrator.model.OrchestrationResult;
import com.aio.orchestrator.model.TaskComplexity;
import com.aio.orchestrator.repository.DecisionRepository;
import com.aio.orchestrator.repository.ExecutionRepository;
import com.aio.orchestrator.repository.StoredDecision;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;

@Component
public class InMemoryDecisionAnalytics implements DecisionAnalytics {

    private final DecisionRepository decisionRepository;
    private final ExecutionRepository executionRepository;

    public InMemoryDecisionAnalytics(DecisionRepository decisionRepository, ExecutionRepository executionRepository) {
        this.decisionRepository = decisionRepository;
        this.executionRepository = executionRepository;
    }

    @Override
    public double successRate(ExecutionStrategy strategy, TaskComplexity complexity) {
        Map<String, StoredDecision> decisions = decisionRepository.findRecent(2000).stream()
                .filter(d -> d.decision().selectedStrategy() == strategy && d.decision().complexity() == complexity)
                .collect(Collectors.toMap(StoredDecision::requestId, Function.identity(), (a, b) -> a));
        if (decisions.isEmpty()) {
            return defaultSuccessRate(strategy);
        }
        long successCount = executionRepository.findRecent(2000).stream()
                .filter(result -> decisions.containsKey(result.requestId()))
                .filter(OrchestrationResult::success)
                .count();
        return (double) successCount / decisions.size();
    }

    @Override
    public double averageCost(ExecutionStrategy strategy) {
        var results = executionRepository.findRecent(2000).stream()
                .filter(result -> result.strategy() == strategy)
                .toList();
        if (results.isEmpty()) {
            return defaultCost(strategy);
        }
        return results.stream().mapToDouble(OrchestrationResult::actualUsd).average().orElse(defaultCost(strategy));
    }

    private double defaultSuccessRate(ExecutionStrategy strategy) {
        return switch (strategy) {
            case DETERMINISTIC_CODE -> 0.99d;
            case AI_SKILL -> 0.94d;
            case SMALL_LLM -> 0.84d;
            case MEDIUM_LLM -> 0.89d;
            case LARGE_LLM -> 0.92d;
            case SINGLE_AGENT -> 0.90d;
            case MULTI_AGENT_WORKFLOW -> 0.93d;
        };
    }

    private double defaultCost(ExecutionStrategy strategy) {
        return switch (strategy) {
            case DETERMINISTIC_CODE -> 0.0001d;
            case AI_SKILL -> 0.002d;
            case SMALL_LLM -> 0.008d;
            case MEDIUM_LLM -> 0.03d;
            case LARGE_LLM -> 0.08d;
            case SINGLE_AGENT -> 0.18d;
            case MULTI_AGENT_WORKFLOW -> 0.32d;
        };
    }
}
