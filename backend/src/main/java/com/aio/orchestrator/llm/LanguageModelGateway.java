package com.aio.orchestrator.llm;

import com.aio.orchestrator.model.OrchestrationResult;
import com.aio.orchestrator.model.UserRequest;

public interface LanguageModelGateway {

    OrchestrationResult infer(UserRequest request);

    String modelTier();
}
