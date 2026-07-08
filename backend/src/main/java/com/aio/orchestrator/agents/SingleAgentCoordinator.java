package com.aio.orchestrator.agents;

import com.aio.orchestrator.model.OrchestrationResult;
import com.aio.orchestrator.model.UserRequest;

public interface SingleAgentCoordinator {

    OrchestrationResult execute(UserRequest request);
}
