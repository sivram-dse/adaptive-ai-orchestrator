package com.aio.orchestrator.orchestrator.path;

import com.aio.orchestrator.model.ExecutionStrategy;
import com.aio.orchestrator.model.OrchestrationResult;
import com.aio.orchestrator.model.UserRequest;
import com.aio.orchestrator.orchestrator.ExecutionPath;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class DeterministicCodeExecutionPath implements ExecutionPath {

    @Override
    public ExecutionStrategy strategy() {
        return ExecutionStrategy.DETERMINISTIC_CODE;
    }

    @Override
    public OrchestrationResult execute(UserRequest request) {
        String payload = request.payload().toLowerCase(Locale.ROOT);
        String output;
        if (payload.contains("json")) {
            output = "{\"valid\":true,\"message\":\"JSON validation completed\"}";
        } else if (payload.contains("sql")) {
            output = "SELECT id, name FROM customers WHERE active = true;";
        } else {
            output = "Deterministic rule engine executed successfully.";
        }
        return new OrchestrationResult(
                request.requestId(),
                request.metadata().getOrDefault("correlationId", "n/a"),
                ExecutionStrategy.DETERMINISTIC_CODE,
                output,
                0.99d,
                80,
                0,
                0.0001d,
                0.0001d,
                0,
                true,
                "Selected deterministic path for fast, low-cost predictable behavior.",
                List.of(ExecutionStrategy.DETERMINISTIC_CODE),
                Map.of(ExecutionStrategy.DETERMINISTIC_CODE, 1d),
                Instant.now());
    }
}
