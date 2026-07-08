package com.aio.orchestrator.service;

import com.aio.orchestrator.analytics.LearningEngine;
import com.aio.orchestrator.model.OrchestrationResult;
import com.aio.orchestrator.model.StrategyDecision;
import com.aio.orchestrator.model.UserRequest;
import com.aio.orchestrator.orchestrator.AdaptiveOrchestrator;
import com.aio.orchestrator.telemetry.CorrelationIdFilter;
import com.aio.orchestrator.telemetry.trace.ExecutionTraceService;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.stereotype.Service;

@Service
public class DefaultOrchestrationService implements OrchestrationService {

    private static final Logger logger = LoggerFactory.getLogger(DefaultOrchestrationService.class);

    private final AdaptiveOrchestrator adaptiveOrchestrator;
    private final LearningEngine learningEngine;
    private final ExecutionTraceService executionTraceService;

    public DefaultOrchestrationService(
            AdaptiveOrchestrator adaptiveOrchestrator,
            LearningEngine learningEngine,
            ExecutionTraceService executionTraceService) {
        this.adaptiveOrchestrator = adaptiveOrchestrator;
        this.learningEngine = learningEngine;
        this.executionTraceService = executionTraceService;
    }

    @Override
    public OrchestrationResult execute(UserRequest request) {
        UserRequest enrichedRequest = enrichRequest(request);
        String correlationId = enrichedRequest.metadata().get("correlationId");
        executionTraceService.start(enrichedRequest, correlationId);
        try {
            StrategyDecision decision = adaptiveOrchestrator.decide(enrichedRequest);
            executionTraceService.markDecision(enrichedRequest.requestId(), decision);
            OrchestrationResult result = adaptiveOrchestrator.execute(enrichedRequest, decision);
            executionTraceService.markResult(enrichedRequest.requestId(), result);
            learningEngine.learn(decision, result);
            logger.info(
                    "event=orchestration_completed requestId={} correlationId={} strategy={} success={}",
                    result.requestId(),
                    correlationId,
                    result.strategy(),
                    result.success());
            return result;
        } catch (RuntimeException ex) {
            executionTraceService.markError(enrichedRequest.requestId(), ex.getMessage());
            throw ex;
        }
    }

    private UserRequest enrichRequest(UserRequest request) {
        String requestId = (request.requestId() == null || request.requestId().isBlank())
                ? "req-" + UUID.randomUUID()
                : request.requestId();
        String correlationId = MDC.get(CorrelationIdFilter.CORRELATION_ID_KEY);
        if (correlationId == null || correlationId.isBlank()) {
            correlationId = UUID.randomUUID().toString();
        }
        Map<String, String> metadata = request.metadata() == null ? new HashMap<>() : new HashMap<>(request.metadata());
        metadata.put("correlationId", correlationId);
        return new UserRequest(requestId, request.tenantId(), request.userId(), request.payload(), metadata);
    }
}
