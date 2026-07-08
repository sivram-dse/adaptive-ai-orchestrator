package com.aio.orchestrator.orchestrator;

import com.aio.orchestrator.model.ExecutionStrategy;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;

@Component
public class DefaultExecutionPathRegistry implements ExecutionPathRegistry {

    private final Map<ExecutionStrategy, ExecutionPath> pathByStrategy;

    public DefaultExecutionPathRegistry(java.util.List<ExecutionPath> paths) {
        this.pathByStrategy = paths.stream().collect(Collectors.toMap(ExecutionPath::strategy, Function.identity()));
    }

    @Override
    public ExecutionPath resolve(ExecutionStrategy strategy) {
        ExecutionPath path = pathByStrategy.get(strategy);
        if (path == null) {
            throw new IllegalArgumentException("No execution path configured for strategy: " + strategy);
        }
        return path;
    }
}
