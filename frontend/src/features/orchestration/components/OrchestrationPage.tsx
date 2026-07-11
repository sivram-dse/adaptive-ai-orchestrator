import { FormEvent, useEffect, useMemo, useState } from "react";
import { CheckCircle2, LoaderCircle, Play, TriangleAlert, X } from "lucide-react";
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
import { ExecutionVisualization } from "./ExecutionVisualization";
import { CostIntelligenceDashboard } from "./CostIntelligenceDashboard";
import { ExplainableAIPanel } from "./ExplainableAIPanel";
import { DemoCenter, DemoScenario } from "./DemoCenter";

const CATEGORIES = [
  "coding",
  "medical",
  "finance",
  "travel",
  "research",
  "translation",
  "summarization",
  "classification",
  "analytics",
  "sql",
  "email",
  "reasoning",
] as const;

const DIFFICULTIES = ["easy", "medium", "complex"] as const;

type PromptCategory = (typeof CATEGORIES)[number];
type PromptDifficulty = (typeof DIFFICULTIES)[number];

export function OrchestrationPage() {
  const api = useMemo(() => new HttpOrchestrationApi(), []);
  const [prompt, setPrompt] = useState("Validate this JSON payload and confirm required keys.");
  const [difficulty, setDifficulty] = useState<PromptDifficulty>("easy");
  const [category, setCategory] = useState<PromptCategory>("coding");
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
  const [toast, setToast] = useState<{ tone: "success" | "error"; message: string } | null>(null);

  const selectedTrace = traces.find((trace) => trace.requestId === result?.requestId) ?? traces[0];

  useEffect(() => {
    void refreshDashboard();
    const timer = window.setInterval(() => {
      void refreshDashboard(false);
    }, 6000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 4500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const filteredHistory = history.filter((item) => pathFilter === "ALL" || item.strategy === pathFilter);

  function onPromptChange(nextPrompt: string) {
    setPrompt(nextPrompt);
    const inferredCategory = inferPromptCategory(nextPrompt);
    const nextCategory = inferredCategory ?? category;
    if (inferredCategory && inferredCategory !== category) {
      setCategory(inferredCategory);
    }
    const inferredDifficulty = inferPromptDifficulty(nextPrompt, nextCategory);
    if (inferredDifficulty && inferredDifficulty !== difficulty) {
      setDifficulty(inferredDifficulty);
    }
  }

  function onCategoryChange(nextCategory: PromptCategory) {
    setCategory(nextCategory);
    const inferredDifficulty = inferPromptDifficulty(prompt, nextCategory);
    if (inferredDifficulty && inferredDifficulty !== difficulty) {
      setDifficulty(inferredDifficulty);
    }
  }

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
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function onExecute(event: FormEvent) {
    event.preventDefault();
    const inferredCategory = inferPromptCategory(prompt);
    const executionCategory = inferredCategory ?? category;
    const inferredDifficulty = inferPromptDifficulty(prompt, executionCategory);
    const executionDifficulty = inferredDifficulty ?? difficulty;
    if (executionCategory !== category) {
      setCategory(executionCategory);
    }
    if (executionDifficulty !== difficulty) {
      setDifficulty(executionDifficulty);
    }
    await executePrompt(prompt, executionCategory, executionDifficulty);
  }

  async function executePrompt(
    payload: string,
    promptCategory: string,
    promptDifficulty: string,
    extraMetadata?: Record<string, string>,
  ): Promise<OrchestrationResultDto | null> {
    setLoading(true);
    setError(null);
    try {
      const executed = await api.execute({
        tenantId: "enterprise-tenant",
        userId: "architect-user",
        payload,
        metadata: {
          category: promptCategory,
          difficulty: promptDifficulty,
          reasoningDepth: reasoningDepthFor(promptDifficulty),
          contextSize: contextSizeFor(promptDifficulty),
          ...(extraMetadata ?? {}),
        },
      });
      setResult(executed);
      setToast({
        tone: "success",
        message: `Routed to ${executed.strategy.replaceAll("_", " ")} with ${(executed.confidence * 100).toFixed(1)}% confidence.`,
      });
      await refreshDashboard(false);
      return executed;
    } catch (err) {
      const message = (err as Error).message;
      setError(message);
      setToast({ tone: "error", message });
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function onRunDemoScenario(scenario: DemoScenario): Promise<OrchestrationResultDto | null> {
    setPrompt(scenario.prompt);
    setCategory(scenario.category as PromptCategory);
    setDifficulty(scenario.difficulty);
    return executePrompt(scenario.prompt, scenario.category, scenario.difficulty, {
      demoScenario: scenario.id,
      presentationMode: "true",
    });
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-900 p-4 text-slate-100 md:p-6">
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
              onChange={(event) => onPromptChange(event.target.value)}
              className="min-w-0 w-full rounded-lg border border-slate-500 bg-slate-950/70 px-3 py-2 text-sm md:col-span-3"
              placeholder="Enter enterprise prompt"
            />
            <select
              value={category}
              onChange={(event) => onCategoryChange(event.target.value as PromptCategory)}
              className="min-w-0 w-full rounded-lg border border-slate-500 bg-slate-950/70 px-3 py-2 text-sm"
            >
              {CATEGORIES.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
            <select
              value={difficulty}
              onChange={(event) => setDifficulty(event.target.value as PromptDifficulty)}
              className="min-w-0 w-full rounded-lg border border-slate-500 bg-slate-950/70 px-3 py-2 text-sm"
            >
              {DIFFICULTIES.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
            <button
              disabled={loading}
              className="inline-flex min-w-0 w-full items-center justify-center gap-2 rounded-md bg-cyan-500 px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-60"
              type="submit"
            >
              {loading ? <LoaderCircle size={16} className="animate-spin" /> : <Play size={16} />}
              {loading ? "Executing..." : "Run Orchestration"}
            </button>
          </div>
          {error && <p role="alert" className="mt-2 text-xs text-rose-300">{error}</p>}
        </form>

        <section className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <MetricCard label="Requests" value={String(summary?.totalRequests ?? 0)} />
          <MetricCard label="Avg Cost" value={toUsd(summary?.averageCost)} />
          <MetricCard label="Avg Latency" value={toMs(summary?.averageLatencyMs)} />
          <MetricCard label="Avg Tokens" value={toInt(summary?.averageTokens)} />
          <MetricCard label="Success Rate" value={toPct(summary?.successRate)} />
          <MetricCard label="Savings" value={toUsd(summary?.savingsVsAlwaysAgent)} />
        </section>

        <DemoCenter loading={loading} onRunScenario={onRunDemoScenario} />

        <section className="grid gap-4 lg:grid-cols-2">
          <ExecutionVisualization
            prompt={prompt}
            category={category}
            difficulty={difficulty}
            loading={loading}
            result={result}
            selectedTrace={selectedTrace}
          />

          <ExplainableAIPanel
            prompt={prompt}
            category={category}
            difficulty={difficulty}
            result={result}
          />
        </section>

        <CostIntelligenceDashboard history={history} routes={routes} traces={traces} summary={summary} metrics={metrics} />

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
      {toast && <Toast tone={toast.tone} message={toast.message} onClose={() => setToast(null)} />}
    </main>
  );
}

function Toast({ tone, message, onClose }: { tone: "success" | "error"; message: string; onClose: () => void }) {
  const success = tone === "success";
  return (
    <div role="status" className={`fixed bottom-5 right-5 z-[70] flex max-w-sm items-start gap-3 rounded-md border p-3 shadow-2xl ${success ? "border-emerald-300/40 bg-emerald-950 text-emerald-50" : "border-rose-300/40 bg-rose-950 text-rose-50"}`}>
      {success ? <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-300" /> : <TriangleAlert size={18} className="mt-0.5 shrink-0 text-rose-300" />}
      <p className="text-sm leading-5">{message}</p>
      <button type="button" onClick={onClose} className="ml-auto text-current opacity-70 hover:opacity-100" title="Dismiss notification" aria-label="Dismiss notification">
        <X size={16} />
      </button>
    </div>
  );
}

function inferPromptCategory(prompt: string): PromptCategory | null {
  const text = prompt.toLowerCase();
  if (!text.trim()) return null;

  if (matchesAny(text, [/\btravel\b/, /\btrip\b/, /\bitinerary\b/, /\bflight\b/, /\bhotel\b/, /\bcommute\b/, /\btour\b/, /\bvacation\b/])) {
    return "travel";
  }
  if (matchesAny(text, [/\bmedical\b/, /\bpatient\b/, /\bclinical\b/, /\bdiagnosis\b/, /\btreatment\b/, /\bhealth\b/])) {
    return "medical";
  }
  if (matchesAny(text, [/\bfinance\b/, /\bfinancial\b/, /\brevenue\b/, /\bexpense\b/, /\bcost\b/, /\bbudget\b/, /\bprofit\b/, /\bq[1-4]\b/])) {
    return "finance";
  }
  if (matchesAny(text, [/\bresearch\b/, /\bbest practices\b/, /\bcurrent\b/, /\btrends\b/, /\bcitation\b/])) {
    return "research";
  }
  if (matchesAny(text, [/\btranslate\b/, /\btranslation\b/, /\bfrench\b/, /\bspanish\b/, /\bgerman\b/, /\blanguage\b/])) {
    return "translation";
  }
  if (matchesAny(text, [/\bsummarize\b/, /\bsummary\b/, /\bbrief\b/, /\bexecutive bullet\b/])) {
    return "summarization";
  }
  if (matchesAny(text, [/\bclassify\b/, /\bclassification\b/, /\bsentiment\b/, /\blabel\b/, /\bcategory\b/])) {
    return "classification";
  }
  if (matchesAny(text, [/\bsql\b/, /\bpostgres\b/, /\bquery\b/, /\bdatabase\b/, /\btable\b/])) {
    return "sql";
  }
  if (matchesAny(text, [/\bemail\b/, /\bdraft\b/, /\bstakeholder\b/, /\bescalation\b/])) {
    return "email";
  }
  if (matchesAny(text, [/\banalytics\b/, /\bmetric\b/, /\bdashboard\b/, /\banomaly\b/, /\btrend\b/])) {
    return "analytics";
  }
  if (matchesAny(text, [/\barchitecture\b/, /\bmigration\b/, /\breason\b/, /\brisk\b/, /\bcontrols\b/, /\bstrategy\b/])) {
    return "reasoning";
  }
  if (matchesAny(text, [/\bjson\b/, /\bvalidate\b/, /\bcode\b/, /\bregex\b/, /\bapi\b/])) {
    return "coding";
  }
  return null;
}

function inferPromptDifficulty(prompt: string, category: PromptCategory): PromptDifficulty | null {
  const text = prompt.toLowerCase();
  if (!text.trim()) return null;

  const highSignals = countMatches(text, [
    /\barchitecture\b/,
    /\bmigration\b/,
    /\bmulti[- ]?step\b/,
    /\bworkflow\b/,
    /\bstrategy\b/,
    /\bstrategic\b/,
    /\bgovernance\b/,
    /\brisk\b/,
    /\banomal(?:y|ies)\b/,
    /\boptimi[sz]ation/,
    /\bdiagnosis\b/,
    /\bcurrent best practices\b/,
    /\bwith\b.*\band\b/,
  ]);
  const mediumSignals = countMatches(text, [
    /\banaly[sz]e\b/,
    /\banalysis\b/,
    /\breport\b/,
    /\bresearch\b/,
    /\bsql\b/,
    /\bquery\b/,
    /\bdashboard\b/,
    /\btrend/,
    /\bplan\b/,
    /\bitinerary\b/,
    /\bflight\b/,
    /\bhotel\b/,
    /\bbudget\b/,
  ]);
  const lowSignals = countMatches(text, [
    /\bvalidate\b/,
    /\bformat\b/,
    /\btranslate\b/,
    /\bsummarize\b/,
    /\bclassify\b/,
    /\bdraft\b/,
  ]);

  if (category === "travel" && matchesAny(text, [/\bplan\b/, /\btrip\b/, /\bitinerary\b/, /\b\d+[- ]?day\b/])) {
    return "complex";
  }
  if (["medical", "finance", "research", "reasoning"].includes(category) && highSignals + mediumSignals >= 2) {
    return "complex";
  }
  if (highSignals >= 1 || mediumSignals >= 3) {
    return "complex";
  }
  if (mediumSignals >= 1 || ["analytics", "sql", "travel"].includes(category)) {
    return "medium";
  }
  if (lowSignals >= 1) {
    return "easy";
  }
  return null;
}

function reasoningDepthFor(difficulty: string): string {
  if (difficulty === "easy") return "0.2";
  if (difficulty === "medium") return "0.55";
  return "0.85";
}

function contextSizeFor(difficulty: string): string {
  if (difficulty === "easy") return "0.25";
  if (difficulty === "medium") return "0.55";
  return "0.85";
}

function matchesAny(text: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(text));
}

function countMatches(text: string, patterns: RegExp[]) {
  return patterns.filter((pattern) => pattern.test(text)).length;
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
