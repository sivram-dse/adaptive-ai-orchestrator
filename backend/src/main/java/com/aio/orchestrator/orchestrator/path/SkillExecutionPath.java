package com.aio.orchestrator.orchestrator.path;

import com.aio.orchestrator.model.ExecutionStrategy;
import com.aio.orchestrator.model.OrchestrationResult;
import com.aio.orchestrator.model.UserRequest;
import com.aio.orchestrator.orchestrator.ExecutionPath;
import com.aio.orchestrator.skills.SkillRegistry;
import org.springframework.stereotype.Component;

@Component
public class SkillExecutionPath implements ExecutionPath {

    private final SkillRegistry skillRegistry;

    public SkillExecutionPath(SkillRegistry skillRegistry) {
        this.skillRegistry = skillRegistry;
    }

    @Override
    public ExecutionStrategy strategy() {
        return ExecutionStrategy.AI_SKILL;
    }

    @Override
    public OrchestrationResult execute(UserRequest request) {
        return skillRegistry.resolve(request)
                .map(skill -> skill.execute(request))
                .orElseThrow(() -> new IllegalStateException("No skill found for request " + request.requestId()));
    }
}
