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
public class SummarizeSkill implements Skill {

    @Override
    public String skillId() {
        return "SUMMARIZE_V1";
    }

    @Override
    public boolean supports(UserRequest request) {
        String payload = request.payload().toLowerCase(Locale.ROOT);
        return payload.contains("summarize") || payload.contains("summary");
    }

    @Override
    public OrchestrationResult execute(UserRequest request) {
        String text = request.payload();
        String summary = text.length() <= 180 ? text : text.substring(0, 180) + "...";
        return new OrchestrationResult(
                request.requestId(),
                request.metadata().getOrDefault("correlationId", "n/a"),
                ExecutionStrategy.AI_SKILL,
                "Summary: " + summary,
                0.90d,
                210,
                160,
                0.0018d,
                0.0018d,
                0,
                true,
                "Resolved with reusable stateless skill " + skillId(),
                List.of(ExecutionStrategy.AI_SKILL),
                Map.of(ExecutionStrategy.AI_SKILL, 1d),
                Instant.now());
    }
}
