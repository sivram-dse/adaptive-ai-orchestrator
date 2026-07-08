package com.aio.orchestrator.repository;

import com.aio.orchestrator.model.StrategyDecision;
import java.time.Instant;

public record StoredDecision(
        String requestId,
        StrategyDecision decision,
        Instant createdAt
) {
}
