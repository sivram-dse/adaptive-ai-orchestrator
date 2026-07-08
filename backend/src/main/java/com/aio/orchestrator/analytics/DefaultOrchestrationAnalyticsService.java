package com.aio.orchestrator.analytics;

import com.aio.orchestrator.cost.CostEstimator;
import com.aio.orchestrator.model.CostEstimate;
import com.aio.orchestrator.model.ExecutionStrategy;
import com.aio.orchestrator.model.OrchestrationResult;
import com.aio.orchestrator.model.UserRequest;
import com.aio.orchestrator.repository.ExecutionRepository;
import com.aio.orchestrator.service.OrchestrationService;
import java.time.Instant;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;
import org.springframework.stereotype.Service;

@Service
public class DefaultOrchestrationAnalyticsService implements OrchestrationAnalyticsService {

    private final ExecutionRepository executionRepository;
    private final CostEstimator costEstimator;
    private final OrchestrationService orchestrationService;
    private final AtomicReference<CachedScenarios> cachedScenarios = new AtomicReference<>();

    public DefaultOrchestrationAnalyticsService(
            ExecutionRepository executionRepository,
            CostEstimator costEstimator,
            OrchestrationService orchestrationService) {
        this.executionRepository = executionRepository;
        this.costEstimator = costEstimator;
        this.orchestrationService = orchestrationService;
    }

    @Override
    public ExecutionAnalyticsSummary summary() {
        List<OrchestrationResult> results = executionRepository.findRecent(5000);
        if (results.isEmpty()) {
            return new ExecutionAnalyticsSummary(0, 0d, 0d, 0d, 0d, 0d, 0d, 0d, 0d, 0d, 0d, 0d);
        }
        long total = results.size();
        double avgCost = results.stream().mapToDouble(OrchestrationResult::actualUsd).average().orElse(0d);
        double avgLatency = results.stream().mapToInt(OrchestrationResult::latencyMs).average().orElse(0d);
        double avgTokens = results.stream().mapToInt(OrchestrationResult::tokenUsage).average().orElse(0d);
        double avgConfidence = results.stream().mapToDouble(OrchestrationResult::confidence).average().orElse(0d);
        long successCount = results.stream().filter(OrchestrationResult::success).count();
        double successRate = (double) successCount / total;
        double failureRate = 1d - successRate;

        Map<ExecutionStrategy, Long> grouped = new EnumMap<>(ExecutionStrategy.class);
        for (OrchestrationResult result : results) {
            grouped.merge(result.strategy(), 1L, Long::sum);
        }
        double codeUsage = percent(grouped, total, List.of(ExecutionStrategy.DETERMINISTIC_CODE));
        double skillUsage = percent(grouped, total, List.of(ExecutionStrategy.AI_SKILL));
        double agentUsage = percent(grouped, total, List.of(
                ExecutionStrategy.SINGLE_AGENT,
                ExecutionStrategy.MULTI_AGENT_WORKFLOW));
        double llmUsage = percent(grouped, total, List.of(
                ExecutionStrategy.SMALL_LLM,
                ExecutionStrategy.MEDIUM_LLM,
                ExecutionStrategy.LARGE_LLM));
        double savings = results.stream().mapToDouble(r -> Math.max(0d, 0.18d - r.actualUsd())).sum();

        return new ExecutionAnalyticsSummary(
                total,
                avgCost,
                avgLatency,
                avgTokens,
                avgConfidence,
                successRate,
                failureRate,
                skillUsage,
                agentUsage,
                codeUsage,
                llmUsage,
                savings);
    }

    @Override
    public List<RouteUsage> routeUsage() {
        List<OrchestrationResult> results = executionRepository.findRecent(5000);
        if (results.isEmpty()) {
            return List.of();
        }
        long total = results.size();
        Map<ExecutionStrategy, Long> grouped = new EnumMap<>(ExecutionStrategy.class);
        for (OrchestrationResult result : results) {
            grouped.merge(result.strategy(), 1L, Long::sum);
        }
        List<RouteUsage> usage = new ArrayList<>();
        for (Map.Entry<ExecutionStrategy, Long> entry : grouped.entrySet()) {
            usage.add(new RouteUsage(entry.getKey(), entry.getValue(), (entry.getValue() * 100d) / total));
        }
        usage.sort((a, b) -> Long.compare(b.count(), a.count()));
        return usage;
    }

    @Override
    public List<ScenarioBenchmarkResult> demoScenarios() {
        CachedScenarios cache = cachedScenarios.get();
        if (cache != null && cache.validUntil.isAfter(Instant.now())) {
            return cache.results;
        }
        List<ScenarioDefinition> definitions = List.of(
                new ScenarioDefinition(
                        "S1",
                        "Simple JSON validation",
                        "Validate this JSON payload and confirm required keys are present.",
                        "Simple deterministic schema check",
                        ExecutionStrategy.DETERMINISTIC_CODE),
                new ScenarioDefinition(
                        "S2",
                        "Email drafting",
                        "Draft a polite follow-up email for delayed shipment.",
                        "Reusable templated generation",
                        ExecutionStrategy.AI_SKILL),
                new ScenarioDefinition(
                        "S3",
                        "Research question",
                        "Research emerging market trends in enterprise AI governance and provide citations.",
                        "High-context synthesis quality needed",
                        ExecutionStrategy.LARGE_LLM),
                new ScenarioDefinition(
                        "S4",
                        "Travel planning",
                        "Plan a 10-day multi-city travel itinerary with contingency options and trade-offs.",
                        "Multi-step tool-like planning",
                        ExecutionStrategy.SINGLE_AGENT),
                new ScenarioDefinition(
                        "S5",
                        "Enterprise migration planning",
                        "Create enterprise migration plan from monolith to microservices with phased rollout and risk matrix.",
                        "Cross-domain decomposition and iterative validation",
                        ExecutionStrategy.MULTI_AGENT_WORKFLOW)
        );

        List<ScenarioBenchmarkResult> results = new ArrayList<>();
        for (ScenarioDefinition definition : definitions) {
            Map<String, String> metadata = new HashMap<>();
            metadata.put("requiredExecutionPath", definition.expected.name());
            metadata.put("reasoningDepth", switch (definition.expected) {
                case DETERMINISTIC_CODE -> "0.1";
                case AI_SKILL -> "0.2";
                case SMALL_LLM -> "0.35";
                case MEDIUM_LLM -> "0.5";
                case LARGE_LLM -> "0.7";
                case SINGLE_AGENT -> "0.85";
                case MULTI_AGENT_WORKFLOW -> "1.0";
            });
            UserRequest request = new UserRequest(
                    "demo-" + definition.id + "-" + UUID.randomUUID(),
                    "demo-tenant",
                    "demo-user",
                    definition.prompt,
                    metadata);
            CostEstimate estimate = costEstimator.estimate(definition.expected, request);
            OrchestrationResult result = orchestrationService.execute(request);
            double savingsVsAgent = Math.max(0d, 0.18d - result.actualUsd());
            results.add(new ScenarioBenchmarkResult(
                    definition.id,
                    definition.name,
                    definition.prompt,
                    definition.reason,
                    result.strategy(),
                    estimate.estimatedUsd(),
                    result.actualUsd(),
                    estimate.estimatedLatencyMs(),
                    result.latencyMs(),
                    result.tokenUsage(),
                    result.confidence(),
                    savingsVsAgent));
        }
        cachedScenarios.set(new CachedScenarios(Instant.now().plusSeconds(30), List.copyOf(results)));
        return results;
    }

    private double percent(Map<ExecutionStrategy, Long> grouped, long total, List<ExecutionStrategy> strategies) {
        long count = 0;
        for (ExecutionStrategy strategy : strategies) {
            count += grouped.getOrDefault(strategy, 0L);
        }
        return total == 0 ? 0d : (count * 100d) / total;
    }

    private record ScenarioDefinition(
            String id,
            String name,
            String prompt,
            String reason,
            ExecutionStrategy expected
    ) {
    }

    private record CachedScenarios(Instant validUntil, List<ScenarioBenchmarkResult> results) {
    }
}
