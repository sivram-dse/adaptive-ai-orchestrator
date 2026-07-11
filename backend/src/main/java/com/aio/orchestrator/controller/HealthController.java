package com.aio.orchestrator.controller;

import java.time.Instant;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {

    private final String applicationName;

    public HealthController(@Value("${spring.application.name:adaptive-ai-orchestrator}") String applicationName) {
        this.applicationName = applicationName;
    }

    @GetMapping("/health")
    public ResponseEntity<HealthResponse> health() {
        return ResponseEntity.ok(new HealthResponse("UP", applicationName, Instant.now()));
    }

    public record HealthResponse(String status, String service, Instant timestamp) {
    }
}
