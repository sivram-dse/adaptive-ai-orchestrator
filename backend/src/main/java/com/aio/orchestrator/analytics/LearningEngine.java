package com.aio.orchestrator.analytics;

import com.aio.orchestrator.model.OrchestrationResult;
import com.aio.orchestrator.model.StrategyDecision;
import java.util.List;

public interface LearningEngine {

    void learn(StrategyDecision decision, OrchestrationResult result);

    List<LearningSnapshot> latest(int limit);
}
