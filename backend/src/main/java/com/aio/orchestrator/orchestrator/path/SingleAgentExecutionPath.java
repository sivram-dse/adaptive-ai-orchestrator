package com.aio.orchestrator.orchestrator.path;

import com.aio.orchestrator.agents.SingleAgentCoordinator;
import com.aio.orchestrator.model.ExecutionStrategy;
import com.aio.orchestrator.model.OrchestrationResult;
import com.aio.orchestrator.model.UserRequest;
import com.aio.orchestrator.orchestrator.ExecutionPath;
import org.springframework.stereotype.Component;

@Component
public class SingleAgentExecutionPath implements ExecutionPath {

    private final SingleAgentCoordinator singleAgentCoordinator;

    public SingleAgentExecutionPath(SingleAgentCoordinator singleAgentCoordinator) {
        this.singleAgentCoordinator = singleAgentCoordinator;
    }

    @Override
    public ExecutionStrategy strategy() {
        return ExecutionStrategy.SINGLE_AGENT;
    }

    @Override
    public OrchestrationResult execute(UserRequest request) {
        return singleAgentCoordinator.execute(request);
    }
}
