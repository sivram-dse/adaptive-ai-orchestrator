package com.aio.orchestrator.llm.impl;

import com.aio.orchestrator.llm.SmallModelGateway;
import com.aio.orchestrator.model.ExecutionStrategy;
import com.aio.orchestrator.model.OrchestrationResult;
import com.aio.orchestrator.model.UserRequest;
import org.springframework.stereotype.Component;

@Component
public class SmallModelGatewayImpl extends AbstractHeuristicModelGateway implements SmallModelGateway {

    @Override
    public OrchestrationResult infer(UserRequest request) {
        return infer(
                request,
                request.metadata().getOrDefault("correlationId", "n/a"),
                ExecutionStrategy.SMALL_LLM,
                0.84d,
                540,
                650,
                0.008d);
    }

    @Override
    public String modelTier() {
        return "SMALL";
    }
}
