package com.aio.orchestrator.cost;

import com.aio.orchestrator.config.RoutingProperties;
import com.aio.orchestrator.model.ExecutionStrategy;
import java.util.Arrays;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class DefaultCostPolicy implements CostPolicy {

    private final RoutingProperties routingProperties;

    public DefaultCostPolicy(RoutingProperties routingProperties) {
        this.routingProperties = routingProperties;
    }

    @Override
    public List<ExecutionStrategy> allowedStrategies() {
        return Arrays.asList(ExecutionStrategy.values());
    }

    @Override
    public double maxUsdPerRequest() {
        return routingProperties.getMaxAcceptableCostUsd();
    }
}
