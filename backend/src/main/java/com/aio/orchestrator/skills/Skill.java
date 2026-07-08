package com.aio.orchestrator.skills;

import com.aio.orchestrator.model.OrchestrationResult;
import com.aio.orchestrator.model.UserRequest;

public interface Skill {

    String skillId();

    boolean supports(UserRequest request);

    OrchestrationResult execute(UserRequest request);
}
