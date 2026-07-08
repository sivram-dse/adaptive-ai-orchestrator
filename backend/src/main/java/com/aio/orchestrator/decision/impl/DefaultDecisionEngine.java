package com.aio.orchestrator.decision.impl;

import com.aio.orchestrator.analytics.DecisionAnalytics;
import com.aio.orchestrator.config.RoutingProperties;
import com.aio.orchestrator.cost.CostEstimator;
import com.aio.orchestrator.cost.CostPolicy;
import com.aio.orchestrator.decision.DecisionEngine;
import com.aio.orchestrator.decision.StrategySelector;
import com.aio.orchestrator.model.AccuracyTarget;
import com.aio.orchestrator.model.CostEstimate;
import com.aio.orchestrator.model.ExecutionStrategy;
import com.aio.orchestrator.model.StrategyDecision;
import com.aio.orchestrator.model.TaskComplexity;
import com.aio.orchestrator.model.UserRequest;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class DefaultDecisionEngine implements DecisionEngine {

    private static final Logger logger = LoggerFactory.getLogger(DefaultDecisionEngine.class);

    private final HeuristicComplexityClassifier complexityClassifier;
    private final StrategySelector strategySelector;
    private final CostEstimator costEstimator;
    private final CostPolicy costPolicy;
    private final DecisionAnalytics decisionAnalytics;
    private final RoutingProperties routingProperties;

    public DefaultDecisionEngine(
            HeuristicComplexityClassifier complexityClassifier,
            StrategySelector strategySelector,
            CostEstimator costEstimator,
            CostPolicy costPolicy,
            DecisionAnalytics decisionAnalytics,
            RoutingProperties routingProperties) {
        this.complexityClassifier = complexityClassifier;
        this.strategySelector = strategySelector;
        this.costEstimator = costEstimator;
        this.costPolicy = costPolicy;
        this.decisionAnalytics = decisionAnalytics;
        this.routingProperties = routingProperties;
    }

    @Override
    public StrategyDecision evaluate(UserRequest request) {
        TaskComplexity complexity = complexityClassifier.classify(request);
        double complexityScore = complexityClassifier.complexityScore(request);
        AccuracyTarget accuracyTarget = resolveAccuracyTarget(request, complexity);
        Map<String, String> metadata = request.metadata() == null ? Map.of() : request.metadata();
        String forcedPath = metadata.get("requiredExecutionPath");
        if (forcedPath != null) {
            ExecutionStrategy forced = parseForcedStrategy(forcedPath);
            if (forced != null && costPolicy.allowedStrategies().contains(forced)) {
                CostEstimate forcedEstimate = costEstimator.estimate(forced, request);
                Map<ExecutionStrategy, Double> forcedScore = Map.of(forced, 2d);
                return new StrategyDecision(
                        forced,
                        complexity,
                        complexityScore,
                        accuracyTarget,
                        forcedEstimate,
                        List.of(forced),
                        forcedScore,
                        "Forced by policy hint requiredExecutionPath=" + forced);
            }
        }
        List<ExecutionStrategy> candidates = strategySelector.rankCandidateStrategies(request);
        List<ExecutionStrategy> allowed = candidates.stream()
                .filter(costPolicy.allowedStrategies()::contains)
                .toList();

        Map<ExecutionStrategy, Double> scoreByStrategy = new EnumMap<>(ExecutionStrategy.class);
        Map<ExecutionStrategy, CostEstimate> estimateByStrategy = new EnumMap<>(ExecutionStrategy.class);
        List<ExecutionStrategy> acceptable = new ArrayList<>();

        for (ExecutionStrategy strategy : allowed) {
            CostEstimate estimate = costEstimator.estimate(strategy, request);
            estimateByStrategy.put(strategy, estimate);
            double score = score(strategy, complexity, accuracyTarget, estimate);
            scoreByStrategy.put(strategy, score);
            if (isAcceptable(request, strategy, complexity, estimate, accuracyTarget)) {
                acceptable.add(strategy);
            }
        }

        ExecutionStrategy selected = select(acceptable, allowed, estimateByStrategy, scoreByStrategy);
        CostEstimate selectedEstimate = estimateByStrategy.get(selected);
        String rationale = rationale(selected, complexity, accuracyTarget, selectedEstimate, scoreByStrategy);
        logger.info(
                "event=decision_evaluated requestId={} selected={} complexity={} complexityScore={} estCost={} estLatency={} estConfidence={}",
                request.requestId(),
                selected,
                complexity,
                String.format("%.3f", complexityScore),
                selectedEstimate.estimatedUsd(),
                selectedEstimate.estimatedLatencyMs(),
                String.format("%.3f", selectedEstimate.estimatedConfidence()));

        return new StrategyDecision(
                selected,
                complexity,
                complexityScore,
                accuracyTarget,
                selectedEstimate,
                allowed,
                scoreByStrategy,
                rationale
        );
    }

    private AccuracyTarget resolveAccuracyTarget(UserRequest request, TaskComplexity complexity) {
        Map<String, String> metadata = request.metadata() == null ? Map.of() : request.metadata();
        boolean deterministic = "true".equalsIgnoreCase(metadata.getOrDefault("requiresDeterminism", "false"));
        boolean safetyCritical = "true".equalsIgnoreCase(metadata.getOrDefault("safetyCritical", "false"))
                || request.payload().toLowerCase().contains("medical");
        double minimum = switch (complexity) {
            case TRIVIAL -> 0.70d;
            case LOW -> 0.74d;
            case MEDIUM -> 0.79d;
            case HIGH -> 0.84d;
            case CRITICAL -> 0.90d;
        };
        String confidenceHint = metadata.get("confidence");
        if (confidenceHint != null) {
            try {
                minimum = Math.max(minimum, Double.parseDouble(confidenceHint));
            } catch (NumberFormatException ignored) {
                // keep computed minimum
            }
        }
        return new AccuracyTarget(Math.min(0.98d, minimum), deterministic, safetyCritical);
    }

    private double score(
            ExecutionStrategy strategy,
            TaskComplexity complexity,
            AccuracyTarget target,
            CostEstimate estimate) {
        double maxCost = Math.max(0.01d, routingProperties.getMaxAcceptableCostUsd());
        double maxLatency = Math.max(500d, routingProperties.getMaxAcceptableLatencyMs());
        double costPenalty = estimate.estimatedUsd() / maxCost;
        double latencyPenalty = estimate.estimatedLatencyMs() / maxLatency;
        double confidencePenalty = Math.max(0d, target.minimumScore() - estimate.estimatedConfidence()) * 3d;
        double historyPenalty = 1d - decisionAnalytics.successRate(strategy, complexity);
        double complexityMismatch = complexityMismatch(strategy, complexity);
        return 1.5d - (0.34d * costPenalty + 0.22d * latencyPenalty + 0.24d * confidencePenalty
                + 0.12d * historyPenalty + 0.08d * complexityMismatch);
    }

    private double complexityMismatch(ExecutionStrategy strategy, TaskComplexity complexity) {
        return switch (strategy) {
            case DETERMINISTIC_CODE -> complexity.ordinal() <= TaskComplexity.LOW.ordinal() ? 0d : 0.7d;
            case AI_SKILL -> complexity.ordinal() <= TaskComplexity.MEDIUM.ordinal() ? 0d : 0.5d;
            case SMALL_LLM -> complexity.ordinal() <= TaskComplexity.MEDIUM.ordinal() ? 0d : 0.35d;
            case MEDIUM_LLM -> complexity.ordinal() == TaskComplexity.HIGH.ordinal() ? 0d : 0.2d;
            case LARGE_LLM -> complexity.ordinal() >= TaskComplexity.MEDIUM.ordinal() ? 0d : 0.2d;
            case SINGLE_AGENT -> complexity.ordinal() >= TaskComplexity.HIGH.ordinal() ? 0d : 0.3d;
            case MULTI_AGENT_WORKFLOW -> complexity == TaskComplexity.CRITICAL ? 0d : 0.55d;
        };
    }

    private boolean isAcceptable(
            UserRequest request,
            ExecutionStrategy strategy,
            TaskComplexity complexity,
            CostEstimate estimate,
            AccuracyTarget target) {
        if (isGenerativeWorkload(request) && strategy == ExecutionStrategy.DETERMINISTIC_CODE) {
            return false;
        }
        if (requiresHighFidelitySynthesis(request)
                && strategy.ordinal() < ExecutionStrategy.LARGE_LLM.ordinal()) {
            return false;
        }
        if (target.requiresDeterminism()) {
            return estimate.strategy() == ExecutionStrategy.DETERMINISTIC_CODE;
        }
        if (target.safetyCritical() && estimate.estimatedConfidence() < 0.88d) {
            return false;
        }
        if (!supportsComplexity(strategy, complexity)) {
            return false;
        }
        return estimate.estimatedConfidence() >= Math.max(
                        routingProperties.getMinConfidenceThreshold(),
                        target.minimumScore())
                && estimate.estimatedUsd() <= costPolicy.maxUsdPerRequest()
                && estimate.estimatedLatencyMs() <= routingProperties.getMaxAcceptableLatencyMs() * 1.3;
    }

    private boolean supportsComplexity(ExecutionStrategy strategy, TaskComplexity complexity) {
        return switch (strategy) {
            case DETERMINISTIC_CODE -> complexity == TaskComplexity.TRIVIAL || complexity == TaskComplexity.LOW;
            case AI_SKILL -> complexity == TaskComplexity.TRIVIAL
                    || complexity == TaskComplexity.LOW
                    || complexity == TaskComplexity.MEDIUM;
            case SMALL_LLM -> complexity == TaskComplexity.LOW || complexity == TaskComplexity.MEDIUM;
            case MEDIUM_LLM -> complexity == TaskComplexity.MEDIUM || complexity == TaskComplexity.HIGH;
            case LARGE_LLM -> complexity == TaskComplexity.MEDIUM
                    || complexity == TaskComplexity.HIGH
                    || complexity == TaskComplexity.CRITICAL;
            case SINGLE_AGENT -> complexity == TaskComplexity.HIGH || complexity == TaskComplexity.CRITICAL;
            case MULTI_AGENT_WORKFLOW -> complexity == TaskComplexity.CRITICAL;
        };
    }

    private boolean isGenerativeWorkload(UserRequest request) {
        String payload = request.payload() == null ? "" : request.payload().toLowerCase(Locale.ROOT);
        return payload.contains("email")
                || payload.contains("draft")
                || payload.contains("research")
                || payload.contains("explain")
                || payload.contains("plan")
                || payload.contains("itinerary")
                || payload.contains("migration")
                || payload.contains("summarize")
                || payload.contains("translate")
                || payload.contains("question");
    }

    private boolean requiresHighFidelitySynthesis(UserRequest request) {
        String payload = request.payload() == null ? "" : request.payload().toLowerCase(Locale.ROOT);
        return payload.contains("research")
                || payload.contains("citation")
                || payload.contains("regulatory")
                || payload.contains("governance")
                || payload.contains("multi-source");
    }

    private ExecutionStrategy parseForcedStrategy(String forcedPath) {
        try {
            return ExecutionStrategy.valueOf(forcedPath.trim());
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    private ExecutionStrategy select(
            List<ExecutionStrategy> acceptable,
            List<ExecutionStrategy> allowed,
            Map<ExecutionStrategy, CostEstimate> estimateByStrategy,
            Map<ExecutionStrategy, Double> scoreByStrategy) {
        if (!acceptable.isEmpty()) {
            return acceptable.stream()
                    .min(Comparator.comparingDouble((ExecutionStrategy s) -> estimateByStrategy.get(s).estimatedUsd())
                            .thenComparingInt(s -> estimateByStrategy.get(s).estimatedLatencyMs()))
                    .orElse(acceptable.getFirst());
        }
        return allowed.stream()
                .max(Comparator.comparingDouble(scoreByStrategy::get))
                .orElse(ExecutionStrategy.LARGE_LLM);
    }

    private String rationale(
            ExecutionStrategy selected,
            TaskComplexity complexity,
            AccuracyTarget target,
            CostEstimate estimate,
            Map<ExecutionStrategy, Double> scoreByStrategy) {
        return "Selected " + selected
                + " because it provided the lowest acceptable projected cost (" + estimate.estimatedUsd()
                + " USD) while meeting confidence target " + target.minimumScore()
                + " for complexity " + complexity
                + ". Score=" + String.format("%.3f", scoreByStrategy.get(selected));
    }
}
