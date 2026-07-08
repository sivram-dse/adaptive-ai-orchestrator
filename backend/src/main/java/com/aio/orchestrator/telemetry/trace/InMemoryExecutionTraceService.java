package com.aio.orchestrator.telemetry.trace;

import com.aio.orchestrator.model.OrchestrationResult;
import com.aio.orchestrator.model.StrategyDecision;
import com.aio.orchestrator.model.UserRequest;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import org.springframework.stereotype.Service;

@Service
public class InMemoryExecutionTraceService implements ExecutionTraceService {

    private final ConcurrentMap<String, TraceState> traces = new ConcurrentHashMap<>();

    @Override
    public void start(UserRequest request, String correlationId) {
        TraceState state = new TraceState();
        state.requestId = request.requestId();
        state.correlationId = correlationId;
        state.tenantId = request.tenantId();
        state.startedAt = Instant.now();
        state.steps.add(new TraceStep(state.startedAt, "REQUEST_RECEIVED", "Request accepted by orchestrator"));
        traces.put(request.requestId(), state);
    }

    @Override
    public void markDecision(String requestId, StrategyDecision decision) {
        TraceState state = traces.get(requestId);
        if (state == null) {
            return;
        }
        state.strategy = decision.selectedStrategy();
        state.estimatedCost = decision.costEstimate().estimatedUsd();
        state.estimatedLatencyMs = decision.costEstimate().estimatedLatencyMs();
        state.steps.add(new TraceStep(
                Instant.now(),
                "DECISION",
                "Selected " + decision.selectedStrategy() + " - " + decision.rationale()));
    }

    @Override
    public void markResult(String requestId, OrchestrationResult result) {
        TraceState state = traces.get(requestId);
        if (state == null) {
            return;
        }
        state.success = result.success();
        state.actualCost = result.actualUsd();
        state.actualLatencyMs = result.latencyMs();
        state.tokenUsage = result.tokenUsage();
        state.confidence = result.confidence();
        state.retryCount = result.retryCount();
        state.completedAt = Instant.now();
        state.steps.add(new TraceStep(state.completedAt, "COMPLETED", "Execution completed"));
    }

    @Override
    public void markError(String requestId, String errorMessage) {
        TraceState state = traces.get(requestId);
        if (state == null) {
            return;
        }
        state.success = false;
        state.completedAt = Instant.now();
        state.steps.add(new TraceStep(state.completedAt, "FAILED", errorMessage));
    }

    @Override
    public List<ExecutionTraceSnapshot> recent(int limit) {
        return traces.values().stream()
                .sorted(Comparator.comparing((TraceState s) -> s.startedAt).reversed())
                .limit(Math.max(1, limit))
                .map(TraceState::toSnapshot)
                .toList();
    }

    @Override
    public Optional<ExecutionTraceSnapshot> get(String requestId) {
        return Optional.ofNullable(traces.get(requestId)).map(TraceState::toSnapshot);
    }

    @Override
    public ExecutionTraceMetrics metrics() {
        List<TraceState> values = traces.values().stream().toList();
        if (values.isEmpty()) {
            return new ExecutionTraceMetrics(0, 0d, 0d, 0d, 0d, 0d, 0d, 0d);
        }
        double avgCost = values.stream().mapToDouble(v -> v.actualCost).average().orElse(0d);
        double avgLatency = values.stream().mapToDouble(v -> v.actualLatencyMs).average().orElse(0d);
        double avgTokens = values.stream().mapToDouble(v -> v.tokenUsage).average().orElse(0d);
        double avgConfidence = values.stream().mapToDouble(v -> v.confidence).average().orElse(0d);
        long successCount = values.stream().filter(v -> v.success).count();
        double successRate = (double) successCount / values.size();
        double failureRate = 1d - successRate;
        double avgAgentCost = 0.18d;
        double savings = values.stream().mapToDouble(v -> Math.max(0d, avgAgentCost - v.actualCost)).sum();
        return new ExecutionTraceMetrics(
                values.size(),
                avgCost,
                avgLatency,
                avgTokens,
                avgConfidence,
                successRate,
                failureRate,
                savings
        );
    }

    private static final class TraceState {
        private String requestId;
        private String correlationId;
        private String tenantId;
        private com.aio.orchestrator.model.ExecutionStrategy strategy;
        private boolean success;
        private double estimatedCost;
        private double actualCost;
        private int estimatedLatencyMs;
        private int actualLatencyMs;
        private int tokenUsage;
        private double confidence;
        private int retryCount;
        private Instant startedAt;
        private Instant completedAt;
        private final List<TraceStep> steps = new ArrayList<>();

        private ExecutionTraceSnapshot toSnapshot() {
            return new ExecutionTraceSnapshot(
                    requestId,
                    correlationId,
                    tenantId,
                    strategy,
                    success,
                    estimatedCost,
                    actualCost,
                    estimatedLatencyMs,
                    actualLatencyMs,
                    tokenUsage,
                    confidence,
                    retryCount,
                    startedAt,
                    completedAt,
                    List.copyOf(steps));
        }
    }
}
