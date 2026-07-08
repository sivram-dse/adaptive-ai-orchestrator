package com.aio.orchestrator.llm.impl;

import com.aio.orchestrator.model.ExecutionStrategy;
import com.aio.orchestrator.model.OrchestrationResult;
import com.aio.orchestrator.model.UserRequest;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

abstract class AbstractHeuristicModelGateway {

    private static final Logger logger = LoggerFactory.getLogger(AbstractHeuristicModelGateway.class);

    protected OrchestrationResult infer(
            UserRequest request,
            String correlationId,
            ExecutionStrategy strategy,
            double confidence,
            int latencyMs,
            int tokens,
            double estimatedUsd) {
        logger.info(
                "event=llm_infer requestId={} strategy={} tokens={} estCost={}",
                request.requestId(),
                strategy,
                tokens,
                estimatedUsd);
        String output = "LLM(" + strategy + ") response for request: " + summarize(request.payload());
        return new OrchestrationResult(
                request.requestId(),
                correlationId,
                strategy,
                output,
                confidence,
                latencyMs,
                tokens,
                estimatedUsd,
                estimatedUsd,
                0,
                true,
                "Executed via " + strategy,
                List.of(strategy),
                Map.of(strategy, 1d),
                Instant.now());
    }

    private String summarize(String payload) {
        if (payload == null) {
            return "";
        }
        int max = Math.min(payload.length(), 120);
        return payload.substring(0, max);
    }
}
