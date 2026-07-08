package com.aio.orchestrator.decision;

import com.aio.orchestrator.model.ExecutionStrategy;
import com.aio.orchestrator.model.UserRequest;
import java.util.List;

public interface StrategySelector {

    List<ExecutionStrategy> rankCandidateStrategies(UserRequest request);
}
