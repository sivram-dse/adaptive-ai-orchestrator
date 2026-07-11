package com.aio.orchestrator.decision;

import static org.assertj.core.api.Assertions.assertThat;

import com.aio.orchestrator.model.ExecutionStrategy;
import com.aio.orchestrator.model.StrategyDecision;
import com.aio.orchestrator.model.UserRequest;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class DefaultDecisionEngineTest {

    @Autowired
    private DecisionEngine decisionEngine;

    @Test
    void shouldRouteSimpleValidationToCode() {
        StrategyDecision decision = decisionEngine.evaluate(new UserRequest(
                "r1",
                "tenant",
                "user",
                "Validate this JSON payload.",
                Map.of("reasoningDepth", "0.1")));

        assertThat(decision.selectedStrategy()).isEqualTo(ExecutionStrategy.DETERMINISTIC_CODE);
    }

    @Test
    void shouldRouteEmailDraftingToSkill() {
        StrategyDecision decision = decisionEngine.evaluate(new UserRequest(
                "r2",
                "tenant",
                "user",
                "Draft an email follow-up for the customer.",
                Map.of("reasoningDepth", "0.2")));

        assertThat(decision.selectedStrategy()).isEqualTo(ExecutionStrategy.AI_SKILL);
    }

    @Test
    void shouldRouteResearchPromptToLargeLlmOrHigher() {
        StrategyDecision decision = decisionEngine.evaluate(new UserRequest(
                "r3",
                "tenant",
                "user",
                "Research enterprise AI governance trends and provide a synthesized report.",
                Map.of("reasoningDepth", "0.75", "contextSize", "0.7")));

        assertThat(decision.selectedStrategy())
                .isIn(ExecutionStrategy.LARGE_LLM, ExecutionStrategy.SINGLE_AGENT, ExecutionStrategy.MULTI_AGENT_WORKFLOW);
    }

    @Test
    void shouldNotRouteUnsupportedFinanceAnalysisToSkill() {
        StrategyDecision decision = decisionEngine.evaluate(new UserRequest(
                "r5",
                "tenant",
                "user",
                "Analyze Q4 revenue and expense trends, identify anomalies, and suggest 3 strategic cost optimizations.",
                Map.of(
                        "category", "finance",
                        "difficulty", "complex",
                        "reasoningDepth", "0.85",
                        "contextSize", "0.85")));

        assertThat(decision.selectedStrategy()).isEqualTo(ExecutionStrategy.LARGE_LLM);
    }

    @Test
    void shouldRouteMigrationPromptToMultiAgentWhenForcedByPolicyHint() {
        StrategyDecision decision = decisionEngine.evaluate(new UserRequest(
                "r4",
                "tenant",
                "user",
                "Create enterprise migration plan across domains with checkpoints and risk matrix.",
                Map.of("reasoningDepth", "1.0", "requiredExecutionPath", "MULTI_AGENT_WORKFLOW")));

        assertThat(decision.selectedStrategy()).isEqualTo(ExecutionStrategy.MULTI_AGENT_WORKFLOW);
    }
}
