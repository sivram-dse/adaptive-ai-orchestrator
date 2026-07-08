package com.aio.orchestrator.telemetry;

import com.aio.orchestrator.telemetry.trace.ExecutionTraceMetrics;
import com.aio.orchestrator.telemetry.trace.ExecutionTraceService;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;

@Component
public class ExecutionTraceHealthIndicator implements HealthIndicator {

    private final ExecutionTraceService executionTraceService;

    public ExecutionTraceHealthIndicator(ExecutionTraceService executionTraceService) {
        this.executionTraceService = executionTraceService;
    }

    @Override
    public Health health() {
        ExecutionTraceMetrics metrics = executionTraceService.metrics();
        return Health.up()
                .withDetail("requests", metrics.totalRequests())
                .withDetail("successRate", metrics.successRate())
                .withDetail("avgLatencyMs", metrics.averageLatencyMs())
                .build();
    }
}
