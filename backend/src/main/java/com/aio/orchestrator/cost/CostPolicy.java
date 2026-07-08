package com.aio.orchestrator.cost;

import com.aio.orchestrator.model.ExecutionStrategy;
import java.util.List;

public interface CostPolicy {

    List<ExecutionStrategy> allowedStrategies();

    double maxUsdPerRequest();
}
