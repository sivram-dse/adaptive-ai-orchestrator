package com.aio.orchestrator.llm.impl;

import com.aio.orchestrator.llm.LargeModelGateway;
import com.aio.orchestrator.model.ExecutionStrategy;
import com.aio.orchestrator.model.OrchestrationResult;
import com.aio.orchestrator.model.UserRequest;
import org.springframework.stereotype.Component;

@Component
public class LargeModelGatewayImpl extends AbstractHeuristicModelGateway implements LargeModelGateway {

    @Override
    public OrchestrationResult infer(UserRequest request) {
        return infer(
                request,
                request.metadata().getOrDefault("correlationId", "n/a"),
                ExecutionStrategy.LARGE_LLM,
                0.93d,
                2400,
                4200,
                0.08d);
    }

    @Override
    public String modelTier() {
        return "LARGE";
    }
}
