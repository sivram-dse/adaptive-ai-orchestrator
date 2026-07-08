package com.aio.orchestrator.orchestrator;

import com.aio.orchestrator.model.ExecutionStrategy;

public interface ExecutionPathRegistry {

    ExecutionPath resolve(ExecutionStrategy strategy);
}
