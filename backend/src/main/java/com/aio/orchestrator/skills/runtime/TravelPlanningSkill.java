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
public class TravelPlanningSkill implements Skill {

    @Override
    public String skillId() {
        return "TRAVEL_PLANNING_V1";
    }

    @Override
    public boolean supports(UserRequest request) {
        String payload = request.payload().toLowerCase(Locale.ROOT);
        String category = request.metadata().getOrDefault("category", "").toLowerCase(Locale.ROOT);
        return "travel".equals(category)
                || payload.contains("travel")
                || payload.contains("trip")
                || payload.contains("itinerary");
    }

    @Override
    public OrchestrationResult execute(UserRequest request) {
        String output = """
                Travel plan draft:
                1. Confirm business dates and preferred arrival buffer.
                2. Shortlist hotels near the primary meeting location.
                3. Allocate daily commute windows and backup transport options.
                4. Reserve one flexible block for stakeholder follow-ups.
                """.strip();
        return new OrchestrationResult(
                request.requestId(),
                request.metadata().getOrDefault("correlationId", "n/a"),
                ExecutionStrategy.AI_SKILL,
                output,
                0.91d,
                260,
                240,
                0.0026d,
                0.0026d,
                0,
                true,
                "Resolved with reusable stateless skill " + skillId(),
                List.of(ExecutionStrategy.AI_SKILL),
                Map.of(ExecutionStrategy.AI_SKILL, 1d),
                Instant.now());
    }
}
