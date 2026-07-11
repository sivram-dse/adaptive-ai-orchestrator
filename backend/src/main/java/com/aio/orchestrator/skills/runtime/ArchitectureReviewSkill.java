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
public class ArchitectureReviewSkill implements Skill {

    @Override
    public String skillId() {
        return "ARCHITECTURE_REVIEW_V1";
    }

    @Override
    public boolean supports(UserRequest request) {
        String payload = request.payload().toLowerCase(Locale.ROOT);
        String category = request.metadata().getOrDefault("category", "").toLowerCase(Locale.ROOT);
        return "reasoning".equals(category)
                || payload.contains("architecture")
                || payload.contains("migration")
                || payload.contains("risk")
                || payload.contains("controls");
    }

    @Override
    public OrchestrationResult execute(UserRequest request) {
        String output = """
                Architecture review:
                - Phase migration around low-risk service boundaries.
                - Add observability, rollback gates, and security controls before cutover.
                - Validate cost, latency, and reliability targets at each release checkpoint.
                """.strip();
        return new OrchestrationResult(
                request.requestId(),
                request.metadata().getOrDefault("correlationId", "n/a"),
                ExecutionStrategy.AI_SKILL,
                output,
                0.90d,
                285,
                280,
                0.0030d,
                0.0030d,
                0,
                true,
                "Resolved with reusable stateless skill " + skillId(),
                List.of(ExecutionStrategy.AI_SKILL),
                Map.of(ExecutionStrategy.AI_SKILL, 1d),
                Instant.now());
    }
}
