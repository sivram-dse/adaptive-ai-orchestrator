package com.aio.orchestrator.analytics;

import com.aio.orchestrator.model.OrchestrationResult;
import com.aio.orchestrator.model.StrategyDecision;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class InMemoryLearningEngine implements LearningEngine {

    private static final int MAX_HISTORY = 2000;
    private final Deque<LearningSnapshot> snapshots = new ArrayDeque<>();

    @Override
    public synchronized void learn(StrategyDecision decision, OrchestrationResult result) {
        LearningSnapshot snapshot = new LearningSnapshot(
                Instant.now(),
                result.strategy(),
                decision.costEstimate().estimatedUsd(),
                result.actualUsd(),
                result.actualUsd() - decision.costEstimate().estimatedUsd(),
                decision.costEstimate().estimatedConfidence(),
                result.confidence(),
                result.success());
        snapshots.addFirst(snapshot);
        while (snapshots.size() > MAX_HISTORY) {
            snapshots.removeLast();
        }
    }

    @Override
    public synchronized List<LearningSnapshot> latest(int limit) {
        return snapshots.stream()
                .limit(Math.max(1, limit))
                .collect(ArrayList::new, ArrayList::add, ArrayList::addAll);
    }
}
