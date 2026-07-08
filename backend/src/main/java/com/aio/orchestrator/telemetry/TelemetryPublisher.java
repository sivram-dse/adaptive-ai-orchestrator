package com.aio.orchestrator.telemetry;

import com.aio.orchestrator.model.OrchestrationResult;
import com.aio.orchestrator.model.StrategyDecision;

public interface TelemetryPublisher {

    void publishDecision(StrategyDecision decision);

    void publishResult(OrchestrationResult result);
}
