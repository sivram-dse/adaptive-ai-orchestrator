package com.aio.orchestrator.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.Map;

public record UserRequest(
        @Size(max = 80) String requestId,
        @NotBlank @Size(max = 80) String tenantId,
        @NotBlank @Size(max = 80) String userId,
        @NotBlank @Size(max = 20000) String payload,
        Map<String, String> metadata
) {
}
