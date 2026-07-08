package com.aio.orchestrator.skills.runtime;

import com.aio.orchestrator.model.UserRequest;
import com.aio.orchestrator.skills.Skill;
import com.aio.orchestrator.skills.SkillRegistry;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Component;

@Component
public class DefaultSkillRegistry implements SkillRegistry {

    private final List<Skill> skills;

    public DefaultSkillRegistry(List<Skill> skills) {
        this.skills = skills;
    }

    @Override
    public Optional<Skill> resolve(UserRequest request) {
        return skills.stream().filter(skill -> skill.supports(request)).findFirst();
    }
}
