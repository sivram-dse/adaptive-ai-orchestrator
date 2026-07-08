package com.aio.orchestrator.analytics;

import java.util.List;

public interface OrchestrationAnalyticsService {

    ExecutionAnalyticsSummary summary();

    List<RouteUsage> routeUsage();

    List<ScenarioBenchmarkResult> demoScenarios();
}
