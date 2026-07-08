package com.aio.orchestrator.skills.runtime;

import com.aio.orchestrator.model.ExecutionStrategy;
import com.aio.orchestrator.model.OrchestrationResult;
import com.aio.orchestrator.model.UserRequest;
import com.aio.orchestrator.skills.Skill;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class ClassificationSkill implements Skill {

    @Override
    public String skillId() {
        return "CLASSIFICATION_V1";
    }

    @Override
    public boolean supports(UserRequest request) {
        String payload = request.payload().toLowerCase(Locale.ROOT);
        return payload.contains("classify") || payload.contains("sentiment") || payload.contains("category");
    }

    @Override
    public OrchestrationResult execute(UserRequest request) {
        String label = request.payload().toLowerCase(Locale.ROOT).contains("negative") ? "NEGATIVE" : "POSITIVE";
        return new OrchestrationResult(
                request.requestId(),
                request.metadata().getOrDefault("correlationId", "n/a"),
                ExecutionStrategy.AI_SKILL,
                "{\"label\":\"" + label + "\"}",
                0.92d,
                180,
                120,
                0.0015d,
                0.0015d,
                0,
                true,
                "Resolved with reusable stateless skill " + skillId(),
                List.of(ExecutionStrategy.AI_SKILL),
                Map.of(ExecutionStrategy.AI_SKILL, 1d),
                Instant.now());
    }
}
