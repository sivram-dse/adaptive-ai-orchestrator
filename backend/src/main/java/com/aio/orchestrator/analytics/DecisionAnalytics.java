package com.aio.orchestrator.analytics;

import com.aio.orchestrator.model.ExecutionStrategy;
import com.aio.orchestrator.model.TaskComplexity;

public interface DecisionAnalytics {

    double successRate(ExecutionStrategy strategy, TaskComplexity complexity);

    double averageCost(ExecutionStrategy strategy);
}
