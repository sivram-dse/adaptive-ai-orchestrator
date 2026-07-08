package com.aio.orchestrator.orchestrator;

import com.aio.orchestrator.model.ExecutionStrategy;
import com.aio.orchestrator.model.OrchestrationResult;
import com.aio.orchestrator.model.UserRequest;

public interface ExecutionPath {

    ExecutionStrategy strategy();

    OrchestrationResult execute(UserRequest request);
}
