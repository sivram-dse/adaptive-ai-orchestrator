package com.aio.orchestrator.decision;

import com.aio.orchestrator.model.StrategyDecision;
import com.aio.orchestrator.model.UserRequest;

public interface DecisionEngine {

    StrategyDecision evaluate(UserRequest request);
}
