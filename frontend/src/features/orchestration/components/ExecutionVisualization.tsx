import { useEffect, useMemo, useState } from "react";
import {
  ExecutionTraceSnapshotDto,
  OrchestrationResultDto,
} from "../../../shared/contracts/orchestration.contracts";

type ExecutionVisualizationProps = {
  prompt: string;
  category: string;
  difficulty: "easy" | "medium" | "complex" | string;
  loading: boolean;
  result: OrchestrationResultDto | null;
  selectedTrace?: ExecutionTraceSnapshotDto;
};

type FlowStage = "prompt" | "decision" | "evaluation" | "path" | "execution" | "response";
type MetricKey =
  | "complexityScore"
  | "contextSize"
  | "reasoningDepth"
  | "privacyLevel"
  | "estimatedCost"
  | "estimatedLatencyMs"
  | "confidenceScore";
type PathLabel = "CODE" | "SKILL" | "SMALL_LLM" | "MEDIUM_LLM" | "LARGE_LLM" | "AGENT" | "MULTI_AGENT";

type EvaluationSnapshot = {
  complexityScore: number;
  contextSize: number;
  reasoningDepth: number;
  privacyLevel: number;
  estimatedCost: number;
  estimatedLatencyMs: number;
  confidenceScore: number;
};

const flowOrder: FlowStage[] = ["prompt", "decision", "evaluation", "path", "execution", "response"];
const executionPaths: PathLabel[] = ["CODE", "SKILL", "SMALL_LLM", "MEDIUM_LLM", "LARGE_LLM", "AGENT", "MULTI_AGENT"];
const metricOrder: MetricKey[] = [
  "complexityScore",
  "contextSize",
  "reasoningDepth",
  "privacyLevel",
  "estimatedCost",
  "estimatedLatencyMs",
  "confidenceScore",
];

export function ExecutionVisualization({
  prompt,
  category,
  difficulty,
  loading,
  result,
  selectedTrace,
}: ExecutionVisualizationProps) {
  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const [visibleMetrics, setVisibleMetrics] = useState(0);

  const estimate = useMemo(
    () => createEvaluationEstimate(prompt, category, difficulty, result),
    [prompt, category, difficulty, result],
  );
  const predictedPath = useMemo(() => choosePath(estimate.complexityScore), [estimate.complexityScore]);
  const selectedPath = result ? toPathLabel(result.strategy) : predictedPath;

  useEffect(() => {
    if (loading) {
      const schedule = [0, 260, 760, 1320, 1880];
      const timers = schedule.map((delay, index) =>
        window.setTimeout(() => setActiveStageIndex(index), delay),
      );
      return () => timers.forEach((timer) => window.clearTimeout(timer));
    }
    setActiveStageIndex(result ? flowOrder.length - 1 : 0);
    return undefined;
  }, [loading, result]);

  useEffect(() => {
    if (activeStageIndex < 2) {
      setVisibleMetrics(0);
      return undefined;
    }
    let current = 0;
    setVisibleMetrics(0);
    const timer = window.setInterval(() => {
      current += 1;
      setVisibleMetrics(Math.min(metricOrder.length, current));
      if (current >= metricOrder.length) {
        window.clearInterval(timer);
      }
    }, 120);
    return () => window.clearInterval(timer);
  }, [activeStageIndex, estimate]);

  const responseOutput = result?.output?.trim() ?? "";

  return (
    <article className="rounded-2xl border border-cyan-200/20 bg-slate-900/70 p-5 shadow-[0_18px_50px_rgba(2,12,27,0.45)] backdrop-blur-sm">
      <h2 className="text-lg font-semibold text-cyan-50">Interactive Execution Visualization</h2>
      <p className="mt-1 text-xs text-cyan-100/70">
        Live routing from prompt intake to response using cost-aware path selection.
      </p>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.35fr,1fr]">
        <div className="space-y-2">
          {flowOrder.map((stage, index) => {
            const state = index < activeStageIndex ? "complete" : index === activeStageIndex ? "active" : "idle";
            return (
              <div key={stage}>
                <div
                  className={`aio-flow-in flex items-center gap-3 rounded-xl border px-3 py-2 transition-all duration-500 ${
                    state === "complete"
                      ? "border-emerald-300/40 bg-emerald-500/15"
                      : state === "active"
                        ? "aio-node-active border-cyan-300/60 bg-cyan-400/10"
                        : "border-slate-700 bg-slate-950/50"
                  }`}
                >
                  <StageIcon stage={stage} className={state === "idle" ? "text-slate-500" : "text-cyan-200"} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-100">{labelForStage(stage)}</p>
                    <p className="truncate text-xs text-slate-300/80">{detailForStage(stage, selectedPath, loading, !!result)}</p>
                  </div>
                  {state === "active" && <span className="ml-auto h-2 w-2 rounded-full bg-cyan-300 animate-ping" />}
                  {state === "complete" && <span className="ml-auto text-xs font-semibold text-emerald-200">Done</span>}
                </div>
                {index < flowOrder.length - 1 && (
                  <div className={`mx-auto my-1 h-4 w-0.5 ${index < activeStageIndex ? "aio-connector-active" : "bg-slate-700"}`} />
                )}
              </div>
            );
          })}
        </div>

        <section className="rounded-xl border border-slate-700/90 bg-slate-950/50 p-3">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-cyan-100/90">Live Evaluation</h3>
          <div className="space-y-2">
            {metricOrder.map((metric, index) => {
              const visible = index < visibleMetrics;
              return (
                <div
                  key={metric}
                  className={`rounded-lg border px-2 py-1.5 text-xs transition duration-500 ${
                    visible ? "border-cyan-300/50 bg-cyan-400/10 opacity-100" : "border-slate-700 bg-slate-900/50 opacity-45"
                  }`}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-slate-200">{labelForMetric(metric)}</span>
                    <span className="font-semibold text-cyan-100">{valueForMetric(metric, estimate)}</span>
                  </div>
                  {metric !== "estimatedCost" && metric !== "estimatedLatencyMs" && (
                    <div className="h-1.5 rounded bg-slate-800">
                      <div
                        className="h-1.5 rounded bg-cyan-300 transition-all duration-700"
                        style={{ width: `${Math.round(valueAsPercent(metric, estimate))}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <div className="mt-4 rounded-xl border border-slate-700/90 bg-slate-950/55 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-cyan-100/90">Selected Execution Path</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {executionPaths.map((path) => (
            <div
              key={path}
              className={`rounded-lg border px-2 py-2 text-center text-xs font-semibold transition ${
                path === selectedPath
                  ? "aio-node-active border-cyan-300/70 bg-cyan-400/15 text-cyan-100"
                  : "border-slate-700 bg-slate-900/60 text-slate-300"
              }`}
            >
              {path}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-700/90 bg-slate-950/55 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-100/90">Execution</p>
          <p className="mt-2 text-xs text-slate-300">
            {loading
              ? "Running selected path with telemetry and trace checkpoints."
              : result
                ? `Completed in ${Math.round(result.latencyMs)} ms with ${Math.round(result.tokenUsage)} tokens.`
                : "Awaiting prompt execution."}
          </p>
          {selectedTrace && (
            <ol className="mt-3 space-y-1.5">
              {selectedTrace.steps.slice(0, 4).map((step) => (
                <li key={`${step.at}-${step.stage}`} className="rounded-md border border-slate-700 bg-slate-900/70 px-2 py-1 text-[11px] text-slate-300">
                  <span className="font-semibold text-cyan-200">{step.stage}</span> - {step.detail}
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="rounded-xl border border-slate-700/90 bg-slate-950/55 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-100/90">Response</p>
          <p className="mt-2 text-xs text-slate-200/90">
            {responseOutput
              ? responseOutput.length > 230
                ? `${responseOutput.slice(0, 230)}...`
                : responseOutput
              : "Response will appear here once execution finishes."}
          </p>
          {result && (
            <div className="mt-2 space-y-1 text-[11px] text-slate-300">
              <p>Rationale: {result.rationale}</p>
              <p>Correlation ID: {result.correlationId}</p>
            </div>
          )}
        </section>
      </div>
    </article>
  );
}

function createEvaluationEstimate(
  prompt: string,
  category: string,
  difficulty: string,
  result: OrchestrationResultDto | null,
): EvaluationSnapshot {
  const normalizedDifficulty = difficulty.toLowerCase();
  const difficultyBase = normalizedDifficulty === "complex" ? 0.82 : normalizedDifficulty === "medium" ? 0.52 : 0.24;
  const promptFactor = clamp(prompt.length / 220, 0.08, 0.9);
  const contextSize = clamp((prompt.length + prompt.split(/\s+/).length * 3) / 600, 0.1, 1);
  const reasoningDepth = clamp(difficultyBase * 0.88 + promptFactor * 0.12, 0.1, 1);
  const categoryWeight = categoryPrivacyWeight(category);
  const complexityScore = clamp(difficultyBase * 0.62 + contextSize * 0.28 + categoryWeight * 0.1, 0.05, 1);
  const confidenceScore = clamp(0.97 - complexityScore * 0.32, 0.5, 0.99);

  if (result) {
    return {
      complexityScore,
      contextSize,
      reasoningDepth,
      privacyLevel: categoryWeight,
      estimatedCost: result.estimatedUsd,
      estimatedLatencyMs: result.latencyMs,
      confidenceScore: result.confidence,
    };
  }

  const predictedPath = choosePath(complexityScore);
  return {
    complexityScore,
    contextSize,
    reasoningDepth,
    privacyLevel: categoryWeight,
    estimatedCost: estimateCostByPath(predictedPath),
    estimatedLatencyMs: estimateLatencyByPath(predictedPath),
    confidenceScore,
  };
}

function categoryPrivacyWeight(category: string): number {
  const normalized = category.toLowerCase();
  if (normalized === "medical" || normalized === "finance") {
    return 0.9;
  }
  if (normalized === "travel" || normalized === "research" || normalized === "analytics") {
    return 0.55;
  }
  return 0.35;
}

function choosePath(complexityScore: number): PathLabel {
  if (complexityScore < 0.16) return "CODE";
  if (complexityScore < 0.3) return "SKILL";
  if (complexityScore < 0.45) return "SMALL_LLM";
  if (complexityScore < 0.61) return "MEDIUM_LLM";
  if (complexityScore < 0.75) return "LARGE_LLM";
  if (complexityScore < 0.88) return "AGENT";
  return "MULTI_AGENT";
}

function estimateCostByPath(path: PathLabel): number {
  const cost: Record<PathLabel, number> = {
    CODE: 0.0001,
    SKILL: 0.0023,
    SMALL_LLM: 0.008,
    MEDIUM_LLM: 0.025,
    LARGE_LLM: 0.082,
    AGENT: 0.18,
    MULTI_AGENT: 0.34,
  };
  return cost[path];
}

function estimateLatencyByPath(path: PathLabel): number {
  const latency: Record<PathLabel, number> = {
    CODE: 85,
    SKILL: 210,
    SMALL_LLM: 650,
    MEDIUM_LLM: 1350,
    LARGE_LLM: 2380,
    AGENT: 4350,
    MULTI_AGENT: 9150,
  };
  return latency[path];
}

function labelForStage(stage: FlowStage): string {
  const label: Record<FlowStage, string> = {
    prompt: "User Prompt",
    decision: "Decision Engine",
    evaluation: "Evaluation Metrics",
    path: "Execution Path Selection",
    execution: "Execution",
    response: "Response",
  };
  return label[stage];
}

function detailForStage(stage: FlowStage, selectedPath: PathLabel, loading: boolean, hasResult: boolean): string {
  if (stage === "prompt") return "Prompt intake and normalization";
  if (stage === "decision") return "Scoring strategy candidates";
  if (stage === "evaluation") return "Complexity, cost, latency, and confidence analysis";
  if (stage === "path") return `Selected route: ${selectedPath}`;
  if (stage === "execution") return loading ? "Executing active route with telemetry" : "Execution complete";
  return hasResult ? "Response emitted to user" : "Waiting for response";
}

function labelForMetric(metric: MetricKey): string {
  const label: Record<MetricKey, string> = {
    complexityScore: "Complexity Score",
    contextSize: "Context Size",
    reasoningDepth: "Reasoning Depth",
    privacyLevel: "Privacy Level",
    estimatedCost: "Estimated Cost",
    estimatedLatencyMs: "Estimated Latency",
    confidenceScore: "Confidence Score",
  };
  return label[metric];
}

function valueForMetric(metric: MetricKey, value: EvaluationSnapshot): string {
  if (metric === "estimatedCost") return `$${value.estimatedCost.toFixed(4)}`;
  if (metric === "estimatedLatencyMs") return `${Math.round(value.estimatedLatencyMs)} ms`;
  return `${Math.round(valueAsPercent(metric, value))}%`;
}

function valueAsPercent(metric: MetricKey, value: EvaluationSnapshot): number {
  if (metric === "complexityScore") return value.complexityScore * 100;
  if (metric === "contextSize") return value.contextSize * 100;
  if (metric === "reasoningDepth") return value.reasoningDepth * 100;
  if (metric === "privacyLevel") return value.privacyLevel * 100;
  if (metric === "confidenceScore") return value.confidenceScore * 100;
  return 0;
}

function toPathLabel(strategy: OrchestrationResultDto["strategy"]): PathLabel {
  if (strategy === "DETERMINISTIC_CODE") return "CODE";
  if (strategy === "AI_SKILL") return "SKILL";
  if (strategy === "SINGLE_AGENT") return "AGENT";
  if (strategy === "MULTI_AGENT_WORKFLOW") return "MULTI_AGENT";
  return strategy;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function StageIcon({ stage, className }: { stage: FlowStage; className: string }) {
  if (stage === "prompt") {
    return (
      <svg viewBox="0 0 24 24" className={`h-4 w-4 ${className}`} fill="none" aria-hidden>
        <path d="M4 7h16M4 12h10M4 17h7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  if (stage === "decision") {
    return (
      <svg viewBox="0 0 24 24" className={`h-4 w-4 ${className}`} fill="none" aria-hidden>
        <path d="M12 3v4m0 10v4M3 12h4m10 0h4m-2.5-6.5-2.8 2.8m-7.4 7.4-2.8 2.8m0-12.9 2.8 2.8m7.4 7.4 2.8 2.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  if (stage === "evaluation") {
    return (
      <svg viewBox="0 0 24 24" className={`h-4 w-4 ${className}`} fill="none" aria-hidden>
        <path d="M4 19V9m5 10V5m5 14v-7m6 7V3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  if (stage === "path") {
    return (
      <svg viewBox="0 0 24 24" className={`h-4 w-4 ${className}`} fill="none" aria-hidden>
        <path d="M4 6h6v4H4V6Zm10 0h6v4h-6V6ZM9 14h6v4H9v-4Zm-2-2 3-2m7 2-3-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (stage === "execution") {
    return (
      <svg viewBox="0 0 24 24" className={`h-4 w-4 ${className}`} fill="none" aria-hidden>
        <path d="M6 12h12m-5-5 5 5-5 5M4 5h4v4H4V5Zm0 10h4v4H4v-4Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={`h-4 w-4 ${className}`} fill="none" aria-hidden>
      <path d="m5 13 4 4L19 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
