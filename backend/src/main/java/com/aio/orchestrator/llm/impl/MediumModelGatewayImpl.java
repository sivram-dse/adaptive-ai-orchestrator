package com.aio.orchestrator.llm.impl;

import com.aio.orchestrator.llm.MediumModelGateway;
import com.aio.orchestrator.model.ExecutionStrategy;
import com.aio.orchestrator.model.OrchestrationResult;
import com.aio.orchestrator.model.UserRequest;
import org.springframework.stereotype.Component;

@Component
public class MediumModelGatewayImpl extends AbstractHeuristicModelGateway implements MediumModelGateway {

    @Override
    public OrchestrationResult infer(UserRequest request) {
        return infer(
                request,
                request.metadata().getOrDefault("correlationId", "n/a"),
                ExecutionStrategy.MEDIUM_LLM,
                0.89d,
                1300,
                1800,
                0.03d);
    }

    @Override
    public String modelTier() {
        return "MEDIUM";
    }
}
