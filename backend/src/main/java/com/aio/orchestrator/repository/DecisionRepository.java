package com.aio.orchestrator.repository;

import com.aio.orchestrator.model.StrategyDecision;
import java.util.List;
import java.util.Optional;

public interface DecisionRepository {

    void save(String requestId, StrategyDecision decision);

    Optional<StoredDecision> findByRequestId(String requestId);

    List<StoredDecision> findRecent(int limit);
}
