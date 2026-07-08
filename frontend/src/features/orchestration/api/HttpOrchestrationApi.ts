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
import { OrchestrationApi } from "./OrchestrationApi";

export class HttpOrchestrationApi implements OrchestrationApi {
  private readonly baseUrl =
    import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/api/v1/orchestrator";

  async execute(request: UserRequestDto): Promise<OrchestrationResultDto> {
    return this.request<OrchestrationResultDto>("/execute", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  async getSummary(): Promise<ExecutionAnalyticsSummaryDto> {
    return this.request<ExecutionAnalyticsSummaryDto>("/analytics/summary");
  }

  async getRouteUsage(): Promise<RouteUsageDto[]> {
    return this.request<RouteUsageDto[]>("/analytics/paths");
  }

  async getHistory(limit = 50): Promise<OrchestrationResultDto[]> {
    return this.request<OrchestrationResultDto[]>(`/analytics/history?limit=${limit}`);
  }

  async getLearning(limit = 50): Promise<LearningSnapshotDto[]> {
    return this.request<LearningSnapshotDto[]>(`/analytics/learning?limit=${limit}`);
  }

  async getScenarios(): Promise<ScenarioBenchmarkResultDto[]> {
    return this.request<ScenarioBenchmarkResultDto[]>("/analytics/scenarios");
  }

  async getTraces(limit = 20): Promise<ExecutionTraceSnapshotDto[]> {
    return this.request<ExecutionTraceSnapshotDto[]>(`/observability/traces?limit=${limit}`);
  }

  async getMetrics(): Promise<ExecutionTraceMetricsDto> {
    return this.request<ExecutionTraceMetricsDto>("/observability/metrics");
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      headers: {
        "Content-Type": "application/json",
      },
      ...init,
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`API ${response.status}: ${text}`);
    }
    return (await response.json()) as T;
  }
}
