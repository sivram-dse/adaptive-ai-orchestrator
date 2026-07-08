package com.aio.orchestrator.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.aio.orchestrator.model.OrchestrationResult;
import com.aio.orchestrator.model.UserRequest;
import com.aio.orchestrator.telemetry.trace.ExecutionTraceService;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class OrchestrationServiceIntegrationTest {

    @Autowired
    private OrchestrationService orchestrationService;

    @Autowired
    private ExecutionTraceService executionTraceService;

    @Test
    void shouldExecuteEndToEndAndCaptureTrace() {
        OrchestrationResult result = orchestrationService.execute(new UserRequest(
                null,
                "tenant",
                "user",
                "Draft a concise email summary and classify the tone.",
                Map.of("category", "email", "difficulty", "easy")));

        assertThat(result.requestId()).isNotBlank();
        assertThat(result.success()).isTrue();
        assertThat(result.actualUsd()).isGreaterThanOrEqualTo(0d);
        assertThat(executionTraceService.get(result.requestId())).isPresent();
    }
}
