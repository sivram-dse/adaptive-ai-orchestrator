package com.aio.orchestrator.telemetry;

import com.aio.orchestrator.model.OrchestrationResult;
import com.aio.orchestrator.model.StrategyDecision;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class StructuredLoggingTelemetryPublisher implements TelemetryPublisher {

    private static final Logger logger = LoggerFactory.getLogger(StructuredLoggingTelemetryPublisher.class);

    @Override
    public void publishDecision(StrategyDecision decision) {
        logger.info(
                "event=decision strategy={} complexity={} complexityScore={} estCost={} estLatency={} rationale=\"{}\"",
                decision.selectedStrategy(),
                decision.complexity(),
                String.format("%.3f", decision.complexityScore()),
                decision.costEstimate().estimatedUsd(),
                decision.costEstimate().estimatedLatencyMs(),
                sanitize(decision.rationale()));
    }

    @Override
    public void publishResult(OrchestrationResult result) {
        logger.info(
                "event=execution requestId={} correlationId={} strategy={} success={} confidence={} latencyMs={} tokens={} actualCost={}",
                result.requestId(),
                result.correlationId(),
                result.strategy(),
                result.success(),
                String.format("%.3f", result.confidence()),
                result.latencyMs(),
                result.tokenUsage(),
                result.actualUsd());
    }

    private String sanitize(String value) {
        return value == null ? "" : value.replaceAll("[\\r\\n]+", " ").trim();
    }
}
