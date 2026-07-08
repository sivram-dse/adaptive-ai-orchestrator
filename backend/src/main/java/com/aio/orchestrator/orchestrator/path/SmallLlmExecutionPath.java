package com.aio.orchestrator.orchestrator.path;

import com.aio.orchestrator.llm.SmallModelGateway;
import com.aio.orchestrator.model.ExecutionStrategy;
import com.aio.orchestrator.model.OrchestrationResult;
import com.aio.orchestrator.model.UserRequest;
import com.aio.orchestrator.orchestrator.ExecutionPath;
import org.springframework.stereotype.Component;

@Component
public class SmallLlmExecutionPath implements ExecutionPath {

    private final SmallModelGateway smallModelGateway;

    public SmallLlmExecutionPath(SmallModelGateway smallModelGateway) {
        this.smallModelGateway = smallModelGateway;
    }

    @Override
    public ExecutionStrategy strategy() {
        return ExecutionStrategy.SMALL_LLM;
    }

    @Override
    public OrchestrationResult execute(UserRequest request) {
        return smallModelGateway.infer(request);
    }
}
