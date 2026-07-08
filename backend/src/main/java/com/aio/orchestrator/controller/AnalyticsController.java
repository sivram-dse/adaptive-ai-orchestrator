package com.aio.orchestrator.controller;

import com.aio.orchestrator.analytics.ExecutionAnalyticsSummary;
import com.aio.orchestrator.analytics.LearningEngine;
import com.aio.orchestrator.analytics.LearningSnapshot;
import com.aio.orchestrator.analytics.OrchestrationAnalyticsService;
import com.aio.orchestrator.analytics.RouteUsage;
import com.aio.orchestrator.analytics.ScenarioBenchmarkResult;
import com.aio.orchestrator.model.OrchestrationResult;
import com.aio.orchestrator.repository.ExecutionRepository;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/orchestrator/analytics")
public class AnalyticsController {

    private final OrchestrationAnalyticsService analyticsService;
    private final LearningEngine learningEngine;
    private final ExecutionRepository executionRepository;

    public AnalyticsController(
            OrchestrationAnalyticsService analyticsService,
            LearningEngine learningEngine,
            ExecutionRepository executionRepository) {
        this.analyticsService = analyticsService;
        this.learningEngine = learningEngine;
        this.executionRepository = executionRepository;
    }

    @GetMapping("/summary")
    public ResponseEntity<ExecutionAnalyticsSummary> summary() {
        return ResponseEntity.ok(analyticsService.summary());
    }

    @GetMapping("/paths")
    public ResponseEntity<List<RouteUsage>> routeUsage() {
        return ResponseEntity.ok(analyticsService.routeUsage());
    }

    @GetMapping("/history")
    public ResponseEntity<List<OrchestrationResult>> history(@RequestParam(defaultValue = "50") int limit) {
        return ResponseEntity.ok(executionRepository.findRecent(limit));
    }

    @GetMapping("/learning")
    public ResponseEntity<List<LearningSnapshot>> learning(@RequestParam(defaultValue = "50") int limit) {
        return ResponseEntity.ok(learningEngine.latest(limit));
    }

    @GetMapping("/scenarios")
    public ResponseEntity<List<ScenarioBenchmarkResult>> scenarios() {
        return ResponseEntity.ok(analyticsService.demoScenarios());
    }
}
