package com.aio.orchestrator.orchestrator;

import com.aio.orchestrator.config.ExecutionProperties;
import com.aio.orchestrator.decision.DecisionEngine;
import com.aio.orchestrator.model.OrchestrationResult;
import com.aio.orchestrator.model.StrategyDecision;
import com.aio.orchestrator.model.UserRequest;
import com.aio.orchestrator.repository.DecisionRepository;
import com.aio.orchestrator.repository.ExecutionRepository;
import com.aio.orchestrator.telemetry.TelemetryPublisher;
import java.time.Instant;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class DefaultAdaptiveOrchestrator implements AdaptiveOrchestrator {

    private static final Logger logger = LoggerFactory.getLogger(DefaultAdaptiveOrchestrator.class);

    private final DecisionEngine decisionEngine;
    private final ExecutionPathRegistry executionPathRegistry;
    private final DecisionRepository decisionRepository;
    private final ExecutionRepository executionRepository;
    private final TelemetryPublisher telemetryPublisher;
    private final ExecutionProperties executionProperties;

    public DefaultAdaptiveOrchestrator(
            DecisionEngine decisionEngine,
            ExecutionPathRegistry executionPathRegistry,
            DecisionRepository decisionRepository,
            ExecutionRepository executionRepository,
            TelemetryPublisher telemetryPublisher,
            ExecutionProperties executionProperties) {
        this.decisionEngine = decisionEngine;
        this.executionPathRegistry = executionPathRegistry;
        this.decisionRepository = decisionRepository;
        this.executionRepository = executionRepository;
        this.telemetryPublisher = telemetryPublisher;
        this.executionProperties = executionProperties;
    }

    @Override
    public StrategyDecision decide(UserRequest request) {
        StrategyDecision decision = decisionEngine.evaluate(request);
        decisionRepository.save(request.requestId(), decision);
        telemetryPublisher.publishDecision(decision);
        return decision;
    }

    @Override
    public OrchestrationResult execute(UserRequest request, StrategyDecision decision) {
        ExecutionPath path = executionPathRegistry.resolve(decision.selectedStrategy());
        RuntimeException lastError = null;
        int attempts = Math.max(1, executionProperties.getMaxRetries() + 1);
        for (int attempt = 1; attempt <= attempts; attempt++) {
            try {
                OrchestrationResult rawResult = path.execute(request);
                OrchestrationResult result = new OrchestrationResult(
                        rawResult.requestId(),
                        rawResult.correlationId(),
                        decision.selectedStrategy(),
                        rawResult.output(),
                        rawResult.confidence(),
                        rawResult.latencyMs(),
                        rawResult.tokenUsage(),
                        decision.costEstimate().estimatedUsd(),
                        rawResult.actualUsd(),
                        attempt - 1,
                        rawResult.success(),
                        decision.rationale(),
                        decision.evaluatedStrategies(),
                        decision.strategyScores(),
                        Instant.now());
                executionRepository.save(result);
                telemetryPublisher.publishResult(result);
                return result;
            } catch (RuntimeException ex) {
                logger.warn(
                        "event=execution_retry requestId={} strategy={} attempt={} error={}",
                        request.requestId(),
                        decision.selectedStrategy(),
                        attempt,
                        ex.getMessage());
                lastError = ex;
            }
        }
        throw new IllegalStateException("Execution failed after retries for request " + request.requestId(), lastError);
    }
}
