package com.aio.orchestrator.analytics;

import com.aio.orchestrator.model.ExecutionStrategy;
import java.time.Instant;

public record LearningSnapshot(
        Instant at,
        ExecutionStrategy strategy,
        double estimatedCost,
        double actualCost,
        double costDelta,
        double estimatedConfidence,
        double actualConfidence,
        boolean success
) {
}
