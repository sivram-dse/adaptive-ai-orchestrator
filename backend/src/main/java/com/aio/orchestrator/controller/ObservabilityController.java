package com.aio.orchestrator.controller;

import com.aio.orchestrator.telemetry.trace.ExecutionTraceMetrics;
import com.aio.orchestrator.telemetry.trace.ExecutionTraceService;
import com.aio.orchestrator.telemetry.trace.ExecutionTraceSnapshot;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/orchestrator/observability")
public class ObservabilityController {

    private final ExecutionTraceService executionTraceService;

    public ObservabilityController(ExecutionTraceService executionTraceService) {
        this.executionTraceService = executionTraceService;
    }

    @GetMapping("/traces")
    public ResponseEntity<List<ExecutionTraceSnapshot>> traces(
            @RequestParam(defaultValue = "20") int limit) {
        return ResponseEntity.ok(executionTraceService.recent(limit));
    }

    @GetMapping("/traces/{requestId}")
    public ResponseEntity<ExecutionTraceSnapshot> trace(@PathVariable String requestId) {
        return executionTraceService.get(requestId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/metrics")
    public ResponseEntity<ExecutionTraceMetrics> metrics() {
        return ResponseEntity.ok(executionTraceService.metrics());
    }
}
