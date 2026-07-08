package com.aio.orchestrator.cost;

import com.aio.orchestrator.model.CostEstimate;
import com.aio.orchestrator.model.ExecutionStrategy;
import com.aio.orchestrator.model.UserRequest;

public interface CostEstimator {

    CostEstimate estimate(ExecutionStrategy strategy, UserRequest request);
}
