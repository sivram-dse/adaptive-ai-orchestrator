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
public class TranslationSkill implements Skill {

    @Override
    public String skillId() {
        return "TRANSLATION_V1";
    }

    @Override
    public boolean supports(UserRequest request) {
        String payload = request.payload().toLowerCase(Locale.ROOT);
        String category = request.metadata().getOrDefault("category", "").toLowerCase(Locale.ROOT);
        return "translation".equals(category) || payload.contains("translate");
    }

    @Override
    public OrchestrationResult execute(UserRequest request) {
        String output = "Traduction: Ce contenu a ete traduit en conservant un ton professionnel et formel.";
        return new OrchestrationResult(
                request.requestId(),
                request.metadata().getOrDefault("correlationId", "n/a"),
                ExecutionStrategy.AI_SKILL,
                output,
                0.92d,
                205,
                150,
                0.0017d,
                0.0017d,
                0,
                true,
                "Resolved with reusable stateless skill " + skillId(),
                List.of(ExecutionStrategy.AI_SKILL),
                Map.of(ExecutionStrategy.AI_SKILL, 1d),
                Instant.now());
    }
}
