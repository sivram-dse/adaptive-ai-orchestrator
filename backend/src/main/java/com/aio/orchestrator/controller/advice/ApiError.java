package com.aio.orchestrator.controller.advice;

import java.time.Instant;
import java.util.List;

public record ApiError(
        Instant timestamp,
        int status,
        String error,
        String message,
        String correlationId,
        List<String> details
) {
}
