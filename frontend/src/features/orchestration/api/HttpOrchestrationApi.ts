import {
  ExecutionAnalyticsSummaryDto,
  ExecutionTraceMetricsDto,
  ExecutionTraceSnapshotDto,
  HealthDto,
  LearningSnapshotDto,
  OrchestrationResultDto,
  RouteUsageDto,
  ScenarioBenchmarkResultDto,
  UserRequestDto,
} from "../../../shared/contracts/orchestration.contracts";
import { OrchestrationApi } from "./OrchestrationApi";

export class HttpOrchestrationApi implements OrchestrationApi {
  private readonly apiOrigin = resolveApiOrigin(import.meta.env.VITE_API_BASE_URL);
  private readonly baseUrl = `${this.apiOrigin}/api/v1/orchestrator`;

  async getHealth(): Promise<HealthDto> {
    return this.fetchJson<HealthDto>(`${this.apiOrigin}/health`, undefined, 75_000);
  }

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
    return this.fetchJson<T>(`${this.baseUrl}${path}`, init);
  }

  private async fetchJson<T>(url: string, init?: RequestInit, timeoutMs = 75_000): Promise<T> {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
    const headers = new Headers(init?.headers);
    headers.set("Accept", "application/json");
    if (init?.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    try {
      const response = await fetch(url, {
        ...init,
        headers,
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(await responseMessage(response));
      }
      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new Error("The backend did not respond in time. A free Render service can take about a minute to wake up.");
      }
      if (error instanceof TypeError) {
        throw new Error("The backend is unavailable. It may be waking from the Render free-tier sleep state.");
      }
      throw error;
    } finally {
      window.clearTimeout(timeout);
    }
  }
}

function resolveApiOrigin(configuredUrl?: string): string {
  const fallback = "http://localhost:8080";
  const normalized = (configuredUrl?.trim() || fallback).replace(/\/+$/, "");
  return normalized.replace(/\/api\/v1\/orchestrator$/, "");
}

async function responseMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string; correlationId?: string };
    const correlation = body.correlationId ? ` Reference: ${body.correlationId}.` : "";
    return `${body.message ?? `API request failed with status ${response.status}.`}${correlation}`;
  } catch {
    return `API request failed with status ${response.status}.`;
  }
}
