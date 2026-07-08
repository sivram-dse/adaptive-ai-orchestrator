package com.aio.orchestrator.repository;

import com.aio.orchestrator.model.OrchestrationResult;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import org.springframework.stereotype.Repository;

@Repository
public class InMemoryExecutionRepository implements ExecutionRepository {

    private final ConcurrentMap<String, OrchestrationResult> store = new ConcurrentHashMap<>();

    @Override
    public void save(OrchestrationResult result) {
        store.put(result.requestId(), result);
    }

    @Override
    public Optional<OrchestrationResult> findByRequestId(String requestId) {
        return Optional.ofNullable(store.get(requestId));
    }

    @Override
    public List<OrchestrationResult> findRecent(int limit) {
        return store.values().stream()
                .sorted(Comparator.comparing(OrchestrationResult::executedAt).reversed())
                .limit(Math.max(1, limit))
                .collect(ArrayList::new, ArrayList::add, ArrayList::addAll);
    }
}
