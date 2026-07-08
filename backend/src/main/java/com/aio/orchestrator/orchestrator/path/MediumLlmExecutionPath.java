package com.aio.orchestrator.orchestrator.path;

import com.aio.orchestrator.llm.MediumModelGateway;
import com.aio.orchestrator.model.ExecutionStrategy;
import com.aio.orchestrator.model.OrchestrationResult;
import com.aio.orchestrator.model.UserRequest;
import com.aio.orchestrator.orchestrator.ExecutionPath;
import org.springframework.stereotype.Component;

@Component
public class MediumLlmExecutionPath implements ExecutionPath {

    private final MediumModelGateway mediumModelGateway;

    public MediumLlmExecutionPath(MediumModelGateway mediumModelGateway) {
        this.mediumModelGateway = mediumModelGateway;
    }

    @Override
    public ExecutionStrategy strategy() {
        return ExecutionStrategy.MEDIUM_LLM;
    }

    @Override
    public OrchestrationResult execute(UserRequest request) {
        return mediumModelGateway.infer(request);
    }
}
