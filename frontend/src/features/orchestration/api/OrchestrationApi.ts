import {
  ExecutionAnalyticsSummaryDto,
  ExecutionTraceMetricsDto,
  ExecutionTraceSnapshotDto,
  LearningSnapshotDto,
  OrchestrationResultDto,
  RouteUsageDto,
  ScenarioBenchmarkResultDto,
  UserRequestDto,
} from "../../../shared/contracts/orchestration.contracts";

export interface OrchestrationApi {
  execute(request: UserRequestDto): Promise<OrchestrationResultDto>;
  getSummary(): Promise<ExecutionAnalyticsSummaryDto>;
  getRouteUsage(): Promise<RouteUsageDto[]>;
  getHistory(limit?: number): Promise<OrchestrationResultDto[]>;
  getLearning(limit?: number): Promise<LearningSnapshotDto[]>;
  getScenarios(): Promise<ScenarioBenchmarkResultDto[]>;
  getTraces(limit?: number): Promise<ExecutionTraceSnapshotDto[]>;
  getMetrics(): Promise<ExecutionTraceMetricsDto>;
}
