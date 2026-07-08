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
public class EmailDraftSkill implements Skill {

    @Override
    public String skillId() {
        return "EMAIL_DRAFTING_V1";
    }

    @Override
    public boolean supports(UserRequest request) {
        String payload = request.payload().toLowerCase(Locale.ROOT);
        return payload.contains("email") || payload.contains("draft");
    }

    @Override
    public OrchestrationResult execute(UserRequest request) {
        String output = "Subject: Follow-up\n\nHello,\n\nBased on your request, here is a concise draft email.\n\nRegards,\nAIO";
        return new OrchestrationResult(
                request.requestId(),
                request.metadata().getOrDefault("correlationId", "n/a"),
                ExecutionStrategy.AI_SKILL,
                output,
                0.91d,
                220,
                170,
                0.002d,
                0.002d,
                0,
                true,
                "Resolved with reusable stateless skill " + skillId(),
                List.of(ExecutionStrategy.AI_SKILL),
                Map.of(ExecutionStrategy.AI_SKILL, 1d),
                Instant.now());
    }
}
