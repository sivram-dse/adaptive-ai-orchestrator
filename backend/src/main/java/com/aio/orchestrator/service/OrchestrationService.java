package com.aio.orchestrator.service;

import com.aio.orchestrator.model.OrchestrationResult;
import com.aio.orchestrator.model.UserRequest;

public interface OrchestrationService {

    OrchestrationResult execute(UserRequest request);
}
