package com.aio.orchestrator.orchestrator;

import com.aio.orchestrator.model.OrchestrationResult;
import com.aio.orchestrator.model.StrategyDecision;
import com.aio.orchestrator.model.UserRequest;

public interface AdaptiveOrchestrator {

    StrategyDecision decide(UserRequest request);

    OrchestrationResult execute(UserRequest request, StrategyDecision decision);
}
