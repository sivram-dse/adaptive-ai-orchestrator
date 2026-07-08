import { FormEvent, useEffect, useMemo, useState } from "react";
import { HttpOrchestrationApi } from "../api/HttpOrchestrationApi";
import {
  ExecutionAnalyticsSummaryDto,
  ExecutionStrategy,
  ExecutionTraceMetricsDto,
  ExecutionTraceSnapshotDto,
  LearningSnapshotDto,
  OrchestrationResultDto,
  RouteUsageDto,
  ScenarioBenchmarkResultDto,
} from "../../../shared/contracts/orchestration.contracts";
import { StrategyBadge } from "./StrategyBadge";

const flowSteps = ["REQUEST_RECEIVED", "DECISION", "COMPLETED"];
const agentBaselineCost = 0.18;

export function OrchestrationPage() {
  const api = useMemo(() => new HttpOrchestrationApi(), []);
  const [prompt, setPrompt] = useState("Validate this JSON payload and confirm required keys.");
  const [difficulty, setDifficulty] = useState("easy");
  const [category, setCategory] = useState("coding");
  const [pathFilter, setPathFilter] = useState<ExecutionStrategy | "ALL">("ALL");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OrchestrationResultDto | null>(null);
  const [summary, setSummary] = useState<ExecutionAnalyticsSummaryDto | null>(null);
  const [metrics, setMetrics] = useState<ExecutionTraceMetricsDto | null>(null);
  const [routes, setRoutes] = useState<RouteUsageDto[]>([]);
  const [history, setHistory] = useState<OrchestrationResultDto[]>([]);
  const [traces, setTraces] = useState<ExecutionTraceSnapshotDto[]>([]);
  const [scenarios, setScenarios] = useState<ScenarioBenchmarkResultDto[]>([]);
  const [learning, setLearning] = useState<LearningSnapshotDto[]>([]);

  const selectedTrace = traces.find((trace) => trace.requestId === result?.requestId) ?? traces[0];

  useEffect(() => {
    void refreshDashboard();
    const timer = window.setInterval(() => {
      void refreshDashboard(false);
    }, 6000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredHistory = history.filter((item) => pathFilter === "ALL" || item.strategy === pathFilter);

  async function refreshDashboard(withScenarios = true) {
    try {
      const [nextSummary, nextMetrics, nextRoutes, nextHistory, nextTraces, nextLearning] = await Promise.all([
        api.getSummary(),
        api.getMetrics(),
        api.getRouteUsage(),
        api.getHistory(40),
        api.getTraces(20),
        api.getLearning(40),
      ]);
      setSummary(nextSummary);
      setMetrics(nextMetrics);
      setRoutes(nextRoutes);
      setHistory(nextHistory);
      setTraces(nextTraces);
      setLearning(nextLearning);
      if (withScenarios) {
        setScenarios(await api.getScenarios());
      }
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function onExecute(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const executed = await api.execute({
        tenantId: "enterprise-tenant",
        userId: "architect-user",
        payload: prompt,
        metadata: {
          category,
          difficulty,
          reasoningDepth: difficulty === "easy" ? "0.2" : difficulty === "medium" ? "0.5" : "0.85",
          contextSize: difficulty === "complex" ? "0.85" : "0.35",
        },
      });
      setResult(executed);
      await refreshDashboard(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-900 p-4 text-slate-100 md:p-6">
      <section className="mx-auto max-w-7xl space-y-4">
        <header className="rounded-2xl border border-cyan-200/20 bg-slate-900/60 p-5 shadow-xl backdrop-blur-sm">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Adaptive AI Orchestrator</h1>
          <p className="mt-2 text-sm text-cyan-100/80">
            Live orchestration across Code, Skills, LLMs, and Agents with cost-aware routing.
          </p>
        </header>

        <form onSubmit={onExecute} className="rounded-2xl border border-cyan-200/20 bg-slate-900/60 p-5">
          <div className="grid gap-3 md:grid-cols-6">
            <input
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              className="md:col-span-3 rounded-lg border border-slate-500 bg-slate-950/70 px-3 py-2 text-sm"
              placeholder="Enter enterprise prompt"
            />
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="rounded-lg border border-slate-500 bg-slate-950/70 px-3 py-2 text-sm"
            >
              {["coding", "medical", "finance", "travel", "research", "translation", "summarization", "classification", "analytics", "sql", "email", "reasoning"].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
            <select
              value={difficulty}
              onChange={(event) => setDifficulty(event.target.value)}
              className="rounded-lg border border-slate-500 bg-slate-950/70 px-3 py-2 text-sm"
            >
              {["easy", "medium", "complex"].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
            <button
              disabled={loading}
              className="rounded-lg bg-cyan-500 px-3 py-2 text-sm font-semibold text-slate-900 transition hover:bg-cyan-400 disabled:opacity-60"
              type="submit"
            >
              {loading ? "Executing..." : "Run Orchestration"}
            </button>
          </div>
          {error && <p className="mt-2 text-xs text-rose-300">{error}</p>}
        </form>

        <section className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <MetricCard label="Requests" value={String(summary?.totalRequests ?? 0)} />
          <MetricCard label="Avg Cost" value={toUsd(summary?.averageCost)} />
          <MetricCard label="Avg Latency" value={toMs(summary?.averageLatencyMs)} />
          <MetricCard label="Avg Tokens" value={toInt(summary?.averageTokens)} />
          <MetricCard label="Success Rate" value={toPct(summary?.successRate)} />
          <MetricCard label="Savings" value={toUsd(summary?.savingsVsAlwaysAgent)} />
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border border-cyan-200/20 bg-slate-900/60 p-5">
            <h2 className="text-lg font-semibold">Live Execution Visualization</h2>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {flowSteps.map((step) => {
                const complete = selectedTrace?.steps.some((traceStep) => traceStep.stage === step);
                return (
                  <div key={step} className={`rounded-full px-3 py-1 text-xs font-semibold ${complete ? "bg-emerald-400 text-slate-900" : "bg-slate-700 text-slate-200"}`}>
                    {step}
                  </div>
                );
              })}
            </div>
            {result && (
              <div className="mt-4 space-y-2 text-sm">
                <StrategyBadge strategy={result.strategy} />
                <p className="text-cyan-100/90">{result.rationale}</p>
                <p className="text-xs text-slate-300">Correlation ID: {result.correlationId}</p>
              </div>
            )}
            {selectedTrace && (
              <ol className="mt-4 space-y-2 text-xs">
                {selectedTrace.steps.map((step) => (
                  <li key={`${step.at}-${step.stage}`} className="rounded-lg border border-slate-700 bg-slate-950/50 p-2">
                    <span className="font-semibold text-cyan-300">{step.stage}</span> - {step.detail}
                  </li>
                ))}
              </ol>
            )}
          </article>

          <article className="rounded-2xl border border-cyan-200/20 bg-slate-900/60 p-5">
            <h2 className="text-lg font-semibold">Decision Tree Scores</h2>
            <div className="mt-3 space-y-2">
              {result &&
                Object.entries(result.decisionScores ?? {})
                  .sort((a, b) => b[1] - a[1])
                  .map(([strategy, score]) => (
                    <div key={strategy}>
                      <div className="mb-1 flex justify-between text-xs">
                        <span>{strategy}</span>
                        <span>{score.toFixed(3)}</span>
                      </div>
                      <div className="h-2 rounded bg-slate-700">
                        <div className="h-2 rounded bg-cyan-400" style={{ width: `${Math.max(5, Math.min(100, score * 60))}%` }} />
                      </div>
                    </div>
                  ))}
              {!result && <p className="text-sm text-slate-300">Execute a request to see strategy scoring.</p>}
            </div>
          </article>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <article className="rounded-2xl border border-cyan-200/20 bg-slate-900/60 p-5">
            <h3 className="font-semibold">Cost Comparison</h3>
            <p className="mt-2 text-sm">Actual: {toUsd(result?.actualUsd)}</p>
            <p className="text-sm">Always Agent Baseline: {toUsd(agentBaselineCost)}</p>
            <p className="text-sm text-emerald-300">Savings: {toUsd(result ? Math.max(0, agentBaselineCost - result.actualUsd) : 0)}</p>
          </article>
          <article className="rounded-2xl border border-cyan-200/20 bg-slate-900/60 p-5">
            <h3 className="font-semibold">Latency & Tokens</h3>
            <p className="mt-2 text-sm">Latency: {toMs(result?.latencyMs)}</p>
            <p className="text-sm">Tokens: {toInt(result?.tokenUsage)}</p>
            <p className="text-sm">Retries: {result?.retryCount ?? 0}</p>
          </article>
          <article className="rounded-2xl border border-cyan-200/20 bg-slate-900/60 p-5">
            <h3 className="font-semibold">Confidence</h3>
            <div className="mt-3 h-3 rounded bg-slate-700">
              <div className="h-3 rounded bg-emerald-400" style={{ width: `${Math.round((result?.confidence ?? 0) * 100)}%` }} />
            </div>
            <p className="mt-2 text-sm">{toPct(result?.confidence)}</p>
          </article>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border border-cyan-200/20 bg-slate-900/60 p-5">
            <h3 className="font-semibold">Execution Path Mix</h3>
            <div className="mt-3 space-y-2">
              {routes.map((route) => (
                <div key={route.strategy}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span>{route.strategy}</span>
                    <span>
                      {route.count} ({route.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-2 rounded bg-slate-700">
                    <div className="h-2 rounded bg-amber-300" style={{ width: `${route.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-slate-300">
              Skill usage: {toPct(summary?.skillUsagePct ? summary.skillUsagePct / 100 : 0)} | Agent usage:{" "}
              {toPct(summary?.agentUsagePct ? summary.agentUsagePct / 100 : 0)}
            </p>
          </article>
          <article className="rounded-2xl border border-cyan-200/20 bg-slate-900/60 p-5">
            <h3 className="font-semibold">Learning Trends (Cost Delta)</h3>
            <div className="mt-3 space-y-2">
              {learning.slice(0, 10).map((item) => (
                <div key={item.at} className="flex items-center justify-between text-xs">
                  <span>{item.strategy}</span>
                  <span className={item.costDelta <= 0 ? "text-emerald-300" : "text-rose-300"}>
                    {item.costDelta <= 0 ? "-" : "+"}
                    {toUsd(Math.abs(item.costDelta))}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-slate-300">
              Success {toPct(metrics?.successRate)} | Failure {toPct(metrics?.failureRate)}
            </p>
          </article>
        </section>

        <section className="rounded-2xl border border-cyan-200/20 bg-slate-900/60 p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-semibold">Execution Timeline</h3>
            <select
              value={pathFilter}
              onChange={(event) => setPathFilter(event.target.value as ExecutionStrategy | "ALL")}
              className="rounded-lg border border-slate-500 bg-slate-950/70 px-2 py-1 text-xs"
            >
              <option value="ALL">All Paths</option>
              {(["DETERMINISTIC_CODE", "AI_SKILL", "SMALL_LLM", "MEDIUM_LLM", "LARGE_LLM", "SINGLE_AGENT", "MULTI_AGENT_WORKFLOW"] as ExecutionStrategy[]).map((path) => (
                <option key={path} value={path}>
                  {path}
                </option>
              ))}
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="text-slate-300">
                <tr>
                  <th className="px-2 py-1">Time</th>
                  <th className="px-2 py-1">Path</th>
                  <th className="px-2 py-1">Cost</th>
                  <th className="px-2 py-1">Latency</th>
                  <th className="px-2 py-1">Tokens</th>
                  <th className="px-2 py-1">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.slice(0, 12).map((item) => (
                  <tr key={item.requestId} className="border-t border-slate-700">
                    <td className="px-2 py-1">{new Date(item.executedAt).toLocaleTimeString()}</td>
                    <td className="px-2 py-1">
                      <StrategyBadge strategy={item.strategy} />
                    </td>
                    <td className="px-2 py-1">{toUsd(item.actualUsd)}</td>
                    <td className="px-2 py-1">{toMs(item.latencyMs)}</td>
                    <td className="px-2 py-1">{toInt(item.tokenUsage)}</td>
                    <td className="px-2 py-1">{toPct(item.confidence)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-cyan-200/20 bg-slate-900/60 p-5">
          <h3 className="font-semibold">Benchmark Dashboard (Demo Scenarios)</h3>
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="text-slate-300">
                <tr>
                  <th className="px-2 py-1">Scenario</th>
                  <th className="px-2 py-1">Routed</th>
                  <th className="px-2 py-1">Estimated Cost</th>
                  <th className="px-2 py-1">Actual Cost</th>
                  <th className="px-2 py-1">Estimated Latency</th>
                  <th className="px-2 py-1">Actual Latency</th>
                  <th className="px-2 py-1">Tokens</th>
                  <th className="px-2 py-1">Savings vs Agent</th>
                </tr>
              </thead>
              <tbody>
                {scenarios.map((scenario) => (
                  <tr key={scenario.scenarioId} className="border-t border-slate-700">
                    <td className="px-2 py-1">{scenario.scenarioName}</td>
                    <td className="px-2 py-1">
                      <StrategyBadge strategy={scenario.routedStrategy} />
                    </td>
                    <td className="px-2 py-1">{toUsd(scenario.estimatedCost)}</td>
                    <td className="px-2 py-1">{toUsd(scenario.actualCost)}</td>
                    <td className="px-2 py-1">{toMs(scenario.estimatedLatencyMs)}</td>
                    <td className="px-2 py-1">{toMs(scenario.actualLatencyMs)}</td>
                    <td className="px-2 py-1">{toInt(scenario.tokens)}</td>
                    <td className="px-2 py-1 text-emerald-300">{toUsd(scenario.savingsVsAlwaysAgent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-2xl border border-cyan-200/20 bg-slate-900/60 p-4">
      <p className="text-xs uppercase tracking-wide text-cyan-100/70">{label}</p>
      <p className="mt-2 text-xl font-bold">{value}</p>
    </article>
  );
}

function toUsd(value?: number) {
  return `$${(value ?? 0).toFixed(4)}`;
}

function toMs(value?: number) {
  return `${Math.round(value ?? 0)} ms`;
}

function toInt(value?: number) {
  return `${Math.round(value ?? 0)}`;
}

function toPct(value?: number) {
  return `${((value ?? 0) * 100).toFixed(1)}%`;
}
