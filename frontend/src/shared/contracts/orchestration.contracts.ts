export type ExecutionStrategy =
  | "DETERMINISTIC_CODE"
  | "AI_SKILL"
  | "SMALL_LLM"
  | "MEDIUM_LLM"
  | "LARGE_LLM"
  | "SINGLE_AGENT"
  | "MULTI_AGENT_WORKFLOW";

export interface UserRequestDto {
  requestId?: string;
  tenantId: string;
  userId: string;
  payload: string;
  metadata?: Record<string, string>;
}

export interface OrchestrationResultDto {
  requestId: string;
  correlationId: string;
  strategy: ExecutionStrategy;
  output: string;
  confidence: number;
  latencyMs: number;
  tokenUsage: number;
  estimatedUsd: number;
  actualUsd: number;
  retryCount: number;
  success: boolean;
  rationale: string;
  evaluatedStrategies: ExecutionStrategy[];
  decisionScores: Record<ExecutionStrategy, number>;
  executedAt: string;
}

export interface ExecutionTraceStepDto {
  at: string;
  stage: string;
  detail: string;
}

export interface ExecutionTraceSnapshotDto {
  requestId: string;
  correlationId: string;
  tenantId: string;
  selectedStrategy: ExecutionStrategy;
  success: boolean;
  estimatedCost: number;
  actualCost: number;
  estimatedLatencyMs: number;
  actualLatencyMs: number;
  tokenUsage: number;
  confidence: number;
  retryCount: number;
  startedAt: string;
  completedAt: string;
  steps: ExecutionTraceStepDto[];
}

export interface ExecutionTraceMetricsDto {
  totalRequests: number;
  averageCost: number;
  averageLatencyMs: number;
  averageTokens: number;
  averageConfidence: number;
  successRate: number;
  failureRate: number;
  savingsVsAlwaysAgent: number;
}

export interface ExecutionAnalyticsSummaryDto {
  totalRequests: number;
  averageCost: number;
  averageLatencyMs: number;
  averageTokens: number;
  averageConfidence: number;
  successRate: number;
  failureRate: number;
  skillUsagePct: number;
  agentUsagePct: number;
  codeUsagePct: number;
  llmUsagePct: number;
  savingsVsAlwaysAgent: number;
}

export interface RouteUsageDto {
  strategy: ExecutionStrategy;
  count: number;
  percentage: number;
}

export interface LearningSnapshotDto {
  at: string;
  strategy: ExecutionStrategy;
  estimatedCost: number;
  actualCost: number;
  costDelta: number;
  estimatedConfidence: number;
  actualConfidence: number;
  success: boolean;
}

export interface ScenarioBenchmarkResultDto {
  scenarioId: string;
  scenarioName: string;
  prompt: string;
  reasonForRouting: string;
  routedStrategy: ExecutionStrategy;
  estimatedCost: number;
  actualCost: number;
  estimatedLatencyMs: number;
  actualLatencyMs: number;
  tokens: number;
  confidence: number;
  savingsVsAlwaysAgent: number;
}
