package com.aio.orchestrator.skills;

import com.aio.orchestrator.model.UserRequest;
import java.util.Optional;

public interface SkillRegistry {

    Optional<Skill> resolve(UserRequest request);
}
