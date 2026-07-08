package com.aio.orchestrator.orchestrator.path;

import com.aio.orchestrator.llm.LargeModelGateway;
import com.aio.orchestrator.model.ExecutionStrategy;
import com.aio.orchestrator.model.OrchestrationResult;
import com.aio.orchestrator.model.UserRequest;
import com.aio.orchestrator.orchestrator.ExecutionPath;
import org.springframework.stereotype.Component;

@Component
public class LargeLlmExecutionPath implements ExecutionPath {

    private final LargeModelGateway largeModelGateway;

    public LargeLlmExecutionPath(LargeModelGateway largeModelGateway) {
        this.largeModelGateway = largeModelGateway;
    }

    @Override
    public ExecutionStrategy strategy() {
        return ExecutionStrategy.LARGE_LLM;
    }

    @Override
    public OrchestrationResult execute(UserRequest request) {
        return largeModelGateway.infer(request);
    }
}
