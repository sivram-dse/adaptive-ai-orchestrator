package com.aio.orchestrator.decision.impl;

import static org.assertj.core.api.Assertions.assertThat;

import com.aio.orchestrator.model.TaskComplexity;
import com.aio.orchestrator.model.UserRequest;
import java.util.Map;
import org.junit.jupiter.api.Test;

class HeuristicComplexityClassifierTest {

    private final HeuristicComplexityClassifier classifier = new HeuristicComplexityClassifier();

    @Test
    void shouldKeepSimpleValidationLowComplexity() {
        TaskComplexity complexity = classifier.classify(new UserRequest(
                "r1",
                "tenant",
                "user",
                "Validate this JSON payload.",
                Map.of("difficulty", "easy", "reasoningDepth", "0.1")));

        assertThat(complexity).isIn(TaskComplexity.TRIVIAL, TaskComplexity.LOW);
    }

    @Test
    void shouldPromoteTravelPlanningFromCategoryAndPromptSignals() {
        TaskComplexity complexity = classifier.classify(new UserRequest(
                "r2",
                "tenant",
                "user",
                "Can you plan my trip to Munnar with hotel options and a day-by-day itinerary?",
                Map.of("category", "travel", "difficulty", "complex", "reasoningDepth", "0.85")));

        assertThat(complexity).isIn(TaskComplexity.HIGH, TaskComplexity.CRITICAL);
    }

    @Test
    void shouldRespectComplexFinanceMetadataWithoutDependingOnOneKeyword() {
        TaskComplexity complexity = classifier.classify(new UserRequest(
                "r3",
                "tenant",
                "user",
                "Review Q4 results, identify anomalies, and recommend cost optimizations.",
                Map.of("category", "finance", "difficulty", "complex", "contextSize", "0.85")));

        assertThat(complexity).isIn(TaskComplexity.HIGH, TaskComplexity.CRITICAL);
    }
}
