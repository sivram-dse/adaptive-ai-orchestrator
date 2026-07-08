package com.aio.orchestrator.repository;

import com.aio.orchestrator.model.StrategyDecision;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import org.springframework.stereotype.Repository;

@Repository
public class InMemoryDecisionRepository implements DecisionRepository {

    private final ConcurrentMap<String, StoredDecision> store = new ConcurrentHashMap<>();

    @Override
    public void save(String requestId, StrategyDecision decision) {
        store.put(requestId, new StoredDecision(requestId, decision, Instant.now()));
    }

    @Override
    public Optional<StoredDecision> findByRequestId(String requestId) {
        return Optional.ofNullable(store.get(requestId));
    }

    @Override
    public List<StoredDecision> findRecent(int limit) {
        return store.values().stream()
                .sorted(Comparator.comparing(StoredDecision::createdAt).reversed())
                .limit(Math.max(1, limit))
                .collect(ArrayList::new, ArrayList::add, ArrayList::addAll);
    }
}
