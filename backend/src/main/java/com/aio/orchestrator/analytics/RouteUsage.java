package com.aio.orchestrator.analytics;

import com.aio.orchestrator.model.ExecutionStrategy;

public record RouteUsage(
        ExecutionStrategy strategy,
        long count,
        double percentage
) {
}
