package com.aio.orchestrator.orchestrator.path;

import com.aio.orchestrator.agents.MultiAgentCoordinator;
import com.aio.orchestrator.model.ExecutionStrategy;
import com.aio.orchestrator.model.OrchestrationResult;
import com.aio.orchestrator.model.UserRequest;
import com.aio.orchestrator.orchestrator.ExecutionPath;
import org.springframework.stereotype.Component;

@Component
public class MultiAgentExecutionPath implements ExecutionPath {

    private final MultiAgentCoordinator multiAgentCoordinator;

    public MultiAgentExecutionPath(MultiAgentCoordinator multiAgentCoordinator) {
        this.multiAgentCoordinator = multiAgentCoordinator;
    }

    @Override
    public ExecutionStrategy strategy() {
        return ExecutionStrategy.MULTI_AGENT_WORKFLOW;
    }

    @Override
    public OrchestrationResult execute(UserRequest request) {
        return multiAgentCoordinator.execute(request);
    }
}
