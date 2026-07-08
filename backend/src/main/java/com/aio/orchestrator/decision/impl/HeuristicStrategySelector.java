package com.aio.orchestrator.decision.impl;

import com.aio.orchestrator.decision.StrategySelector;
import com.aio.orchestrator.model.ExecutionStrategy;
import com.aio.orchestrator.model.UserRequest;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class HeuristicStrategySelector implements StrategySelector {

    @Override
    public List<ExecutionStrategy> rankCandidateStrategies(UserRequest request) {
        String payload = request.payload().toLowerCase(Locale.ROOT);
        Map<ExecutionStrategy, Double> rankScore = new EnumMap<>(ExecutionStrategy.class);
        for (ExecutionStrategy strategy : ExecutionStrategy.values()) {
            rankScore.put(strategy, baseRank(strategy));
        }

        if (payload.contains("json validation") || payload.contains("regex") || payload.contains("deterministic")) {
            rankScore.computeIfPresent(ExecutionStrategy.DETERMINISTIC_CODE, (k, v) -> v - 0.5d);
        }
        if (payload.contains("email") || payload.contains("translate") || payload.contains("sentiment")
                || payload.contains("classify")) {
            rankScore.computeIfPresent(ExecutionStrategy.AI_SKILL, (k, v) -> v - 0.3d);
        }
        if (payload.contains("research") || payload.contains("legal") || payload.contains("medical")
                || payload.contains("financial")) {
            rankScore.computeIfPresent(ExecutionStrategy.LARGE_LLM, (k, v) -> v - 0.3d);
        }
        if (payload.contains("travel planning") || payload.contains("tool calling") || payload.contains("multi-step")) {
            rankScore.computeIfPresent(ExecutionStrategy.SINGLE_AGENT, (k, v) -> v - 0.35d);
        }
        if (payload.contains("migration") || payload.contains("enterprise transformation")
                || payload.contains("cross-team")) {
            rankScore.computeIfPresent(ExecutionStrategy.MULTI_AGENT_WORKFLOW, (k, v) -> v - 0.5d);
        }

        Map<String, String> metadata = request.metadata() == null ? Map.of() : request.metadata();
        String requiredPath = metadata.get("requiredExecutionPath");
        if (requiredPath != null) {
            try {
                ExecutionStrategy forced = ExecutionStrategy.valueOf(requiredPath.trim());
                rankScore.computeIfPresent(forced, (k, v) -> v - 0.7d);
            } catch (IllegalArgumentException ignored) {
                // Ignore invalid strategy hints.
            }
        }

        List<ExecutionStrategy> candidates = new ArrayList<>(List.of(ExecutionStrategy.values()));
        candidates.sort(Comparator.comparingDouble(rankScore::get));
        return candidates;
    }

    private double baseRank(ExecutionStrategy strategy) {
        return switch (strategy) {
            case DETERMINISTIC_CODE -> 0.10d;
            case AI_SKILL -> 0.18d;
            case SMALL_LLM -> 0.35d;
            case MEDIUM_LLM -> 0.45d;
            case LARGE_LLM -> 0.58d;
            case SINGLE_AGENT -> 0.72d;
            case MULTI_AGENT_WORKFLOW -> 0.90d;
        };
    }
}
