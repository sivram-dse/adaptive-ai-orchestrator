package com.aio.orchestrator.cost;

import com.aio.orchestrator.model.CostEstimate;
import com.aio.orchestrator.model.ExecutionStrategy;
import com.aio.orchestrator.model.UserRequest;
import java.util.EnumMap;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class DefaultCostEstimator implements CostEstimator {

    private final Map<ExecutionStrategy, Double> baseCost = new EnumMap<>(ExecutionStrategy.class);
    private final Map<ExecutionStrategy, Integer> baseLatencyMs = new EnumMap<>(ExecutionStrategy.class);
    private final Map<ExecutionStrategy, Double> baseConfidence = new EnumMap<>(ExecutionStrategy.class);
    private final Map<ExecutionStrategy, Integer> baseTokens = new EnumMap<>(ExecutionStrategy.class);

    public DefaultCostEstimator() {
        baseCost.put(ExecutionStrategy.DETERMINISTIC_CODE, 0.0001d);
        baseCost.put(ExecutionStrategy.AI_SKILL, 0.002d);
        baseCost.put(ExecutionStrategy.SMALL_LLM, 0.008d);
        baseCost.put(ExecutionStrategy.MEDIUM_LLM, 0.03d);
        baseCost.put(ExecutionStrategy.LARGE_LLM, 0.08d);
        baseCost.put(ExecutionStrategy.SINGLE_AGENT, 0.18d);
        baseCost.put(ExecutionStrategy.MULTI_AGENT_WORKFLOW, 0.32d);

        baseLatencyMs.put(ExecutionStrategy.DETERMINISTIC_CODE, 80);
        baseLatencyMs.put(ExecutionStrategy.AI_SKILL, 220);
        baseLatencyMs.put(ExecutionStrategy.SMALL_LLM, 450);
        baseLatencyMs.put(ExecutionStrategy.MEDIUM_LLM, 1200);
        baseLatencyMs.put(ExecutionStrategy.LARGE_LLM, 2200);
        baseLatencyMs.put(ExecutionStrategy.SINGLE_AGENT, 4200);
        baseLatencyMs.put(ExecutionStrategy.MULTI_AGENT_WORKFLOW, 9000);

        baseConfidence.put(ExecutionStrategy.DETERMINISTIC_CODE, 0.99d);
        baseConfidence.put(ExecutionStrategy.AI_SKILL, 0.91d);
        baseConfidence.put(ExecutionStrategy.SMALL_LLM, 0.84d);
        baseConfidence.put(ExecutionStrategy.MEDIUM_LLM, 0.89d);
        baseConfidence.put(ExecutionStrategy.LARGE_LLM, 0.93d);
        baseConfidence.put(ExecutionStrategy.SINGLE_AGENT, 0.92d);
        baseConfidence.put(ExecutionStrategy.MULTI_AGENT_WORKFLOW, 0.95d);

        baseTokens.put(ExecutionStrategy.DETERMINISTIC_CODE, 0);
        baseTokens.put(ExecutionStrategy.AI_SKILL, 180);
        baseTokens.put(ExecutionStrategy.SMALL_LLM, 600);
        baseTokens.put(ExecutionStrategy.MEDIUM_LLM, 1800);
        baseTokens.put(ExecutionStrategy.LARGE_LLM, 4200);
        baseTokens.put(ExecutionStrategy.SINGLE_AGENT, 7500);
        baseTokens.put(ExecutionStrategy.MULTI_AGENT_WORKFLOW, 16000);
    }

    @Override
    public CostEstimate estimate(ExecutionStrategy strategy, UserRequest request) {
        int payloadSize = request.payload() == null ? 0 : request.payload().length();
        double complexityMultiplier = 1d + Math.min(2d, payloadSize / 2000d);
        int estimatedTokens = (int) Math.round(baseTokens.get(strategy) * complexityMultiplier);
        double estimatedUsd = roundCurrency(baseCost.get(strategy) * complexityMultiplier);
        int estimatedLatencyMs = (int) Math.round(baseLatencyMs.get(strategy) * complexityMultiplier);
        double estimatedConfidence = Math.max(0.4d, baseConfidence.get(strategy) - (complexityMultiplier - 1d) * 0.06d);
        return new CostEstimate(strategy, estimatedUsd, estimatedLatencyMs, estimatedTokens, estimatedConfidence);
    }

    private double roundCurrency(double value) {
        return Math.round(value * 10000d) / 10000d;
    }
}
