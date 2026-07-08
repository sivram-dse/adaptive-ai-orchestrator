package com.aio.orchestrator.telemetry.trace;

import com.aio.orchestrator.model.OrchestrationResult;
import com.aio.orchestrator.model.StrategyDecision;
import com.aio.orchestrator.model.UserRequest;
import java.util.List;
import java.util.Optional;

public interface ExecutionTraceService {

    void start(UserRequest request, String correlationId);

    void markDecision(String requestId, StrategyDecision decision);

    void markResult(String requestId, OrchestrationResult result);

    void markError(String requestId, String errorMessage);

    List<ExecutionTraceSnapshot> recent(int limit);

    Optional<ExecutionTraceSnapshot> get(String requestId);

    ExecutionTraceMetrics metrics();
}
