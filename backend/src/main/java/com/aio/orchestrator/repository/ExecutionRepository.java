package com.aio.orchestrator.repository;

import com.aio.orchestrator.model.OrchestrationResult;
import java.util.List;
import java.util.Optional;

public interface ExecutionRepository {

    void save(OrchestrationResult result);

    Optional<OrchestrationResult> findByRequestId(String requestId);

    List<OrchestrationResult> findRecent(int limit);
}
