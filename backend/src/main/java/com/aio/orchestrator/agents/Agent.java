package com.aio.orchestrator.agents;

import com.aio.orchestrator.model.OrchestrationResult;
import com.aio.orchestrator.model.UserRequest;

public interface Agent {

    String agentId();

    OrchestrationResult run(UserRequest request);
}
