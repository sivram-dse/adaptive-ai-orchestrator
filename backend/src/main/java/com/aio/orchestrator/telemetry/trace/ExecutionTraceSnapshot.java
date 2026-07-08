package com.aio.orchestrator.telemetry.trace;

import com.aio.orchestrator.model.ExecutionStrategy;
import java.time.Instant;
import java.util.List;

public record ExecutionTraceSnapshot(
        String requestId,
        String correlationId,
        String tenantId,
        ExecutionStrategy selectedStrategy,
        boolean success,
        double estimatedCost,
        double actualCost,
        int estimatedLatencyMs,
        int actualLatencyMs,
        int tokenUsage,
        double confidence,
        int retryCount,
        Instant startedAt,
        Instant completedAt,
        List<TraceStep> steps
) {
}
