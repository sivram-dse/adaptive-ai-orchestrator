package com.aio.orchestrator.telemetry.trace;

import java.time.Instant;

public record TraceStep(
        Instant at,
        String stage,
        String detail
) {
}
