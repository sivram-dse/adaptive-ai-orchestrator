package com.aio.orchestrator.controller;

import com.aio.orchestrator.model.OrchestrationResult;
import com.aio.orchestrator.model.UserRequest;
import com.aio.orchestrator.service.OrchestrationService;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/orchestrator")
public class OrchestrationController {

    private final OrchestrationService orchestrationService;

    public OrchestrationController(OrchestrationService orchestrationService) {
        this.orchestrationService = orchestrationService;
    }

    @PostMapping("/execute")
    public ResponseEntity<OrchestrationResult> execute(@Valid @RequestBody UserRequest request) {
        UserRequest normalized = request.metadata() == null
                ? new UserRequest(request.requestId(), request.tenantId(), request.userId(), request.payload(), Map.of())
                : request;
        return ResponseEntity.ok(orchestrationService.execute(normalized));
    }
}
