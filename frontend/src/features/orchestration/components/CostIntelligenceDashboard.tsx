import { useMemo, useState } from "react";
import {
  ExecutionAnalyticsSummaryDto,
  ExecutionStrategy,
  ExecutionTraceMetricsDto,
  ExecutionTraceSnapshotDto,
  OrchestrationResultDto,
  RouteUsageDto,
} from "../../../shared/contracts/orchestration.contracts";

type CostIntelligenceDashboardProps = {
  history: OrchestrationResultDto[];
  routes: RouteUsageDto[];
  traces: ExecutionTraceSnapshotDto[];
  summary: ExecutionAnalyticsSummaryDto | null;
  metrics: ExecutionTraceMetricsDto | null;
};

type BenchmarkRow = {
  name: "Traditional AI" | "Always Agent" | "Adaptive AIO";
  estimatedCost: number;
  estimatedTokens: number;
  latencyMs: number;
  executionTimeMs: number;
  confidence: number;
};

type WindowSize = 10 | 20 | 40;

export function CostIntelligenceDashboard({
  history,
  routes,
  traces,
  summary,
  metrics,
}: CostIntelligenceDashboardProps) {
  const [windowSize, setWindowSize] = useState<WindowSize>(20);
  const [baseline, setBaseline] = useState<"Traditional AI" | "Always Agent">("Always Agent");

  const recent = history.slice(0, windowSize);

  const model = useMemo(() => buildBenchmarkModel(recent, traces), [recent, traces]);
  const baselineRow = baseline === "Always Agent" ? model.agent : model.traditional;

  const moneySavedPct = ratio(model.adaptive.estimatedCost, baselineRow.estimatedCost);
  const tokenSavedPct = ratio(model.adaptive.estimatedTokens, baselineRow.estimatedTokens);
  const latencySavedPct = ratio(model.adaptive.latencyMs, baselineRow.latencyMs);
  const executionTimeSavedPct = ratio(model.adaptive.executionTimeMs, baselineRow.executionTimeMs);

  const routeLegend = routes.length > 0 ? routes : fallbackRoutes(summary);
  const totalRequests = Math.max(1, recent.length);
  const adaptiveCostTotal = model.adaptive.estimatedCost * totalRequests;
  const baselineCostTotal = baselineRow.estimatedCost * totalRequests;
  const moneySavedTotal = Math.max(0, baselineCostTotal - adaptiveCostTotal);
  const tokensSavedTotal = Math.max(
    0,
    baselineRow.estimatedTokens * totalRequests - model.adaptive.estimatedTokens * totalRequests,
  );
  const latencySavedTotal = Math.max(0, baselineRow.latencyMs - model.adaptive.latencyMs);

  const comparisonRows: BenchmarkRow[] = [model.traditional, model.agent, model.adaptive];

  const savingsBars = [
    {
      label: "Money Saved",
      value: moneySavedPct,
      color: "bg-emerald-400",
      sub: `${toUsd(moneySavedTotal)} in ${totalRequests} requests`,
    },
    {
      label: "Token Saved",
      value: tokenSavedPct,
      color: "bg-cyan-400",
      sub: `${toInt(tokensSavedTotal)} tokens avoided`,
    },
    {
      label: "Latency Saved",
      value: latencySavedPct,
      color: "bg-amber-300",
      sub: `${toMs(latencySavedTotal)} faster per request`,
    },
  ];

  const donutGradient = toDonut(routeLegend);

  return (
    <section className="space-y-4 rounded-2xl border border-cyan-200/20 bg-slate-900/60 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Cost Intelligence Dashboard</h2>
          <p className="text-xs text-cyan-100/70">
            Traditional AI vs Always Agent vs Adaptive AI Orchestrator with live savings intelligence.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {[10, 20, 40].map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => setWindowSize(size as WindowSize)}
              className={`rounded-lg border px-2 py-1 text-xs transition ${
                windowSize === size
                  ? "border-cyan-300 bg-cyan-400/20 text-cyan-100"
                  : "border-slate-600 bg-slate-900/70 text-slate-300 hover:border-cyan-400/50"
              }`}
            >
              Last {size}
            </button>
          ))}
          <div className="ml-1 flex rounded-lg border border-slate-600 bg-slate-900/70 p-1 text-xs">
            {(["Traditional AI", "Always Agent"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setBaseline(item)}
                className={`rounded-md px-2 py-1 transition ${
                  baseline === item ? "bg-cyan-400/20 text-cyan-100" : "text-slate-300"
                }`}
              >
                vs {item}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <KpiCard
          icon="money"
          label="Money Saved"
          value={toUsd(moneySavedTotal)}
          sub={`${(moneySavedPct * 100).toFixed(1)}% vs ${baseline}`}
          accent="emerald"
        />
        <KpiCard
          icon="token"
          label="Token Saved"
          value={toInt(tokensSavedTotal)}
          sub={`${(tokenSavedPct * 100).toFixed(1)}% vs ${baseline}`}
          accent="cyan"
        />
        <KpiCard
          icon="speed"
          label="Latency Saved"
          value={toMs(latencySavedTotal)}
          sub={`${(latencySavedPct * 100).toFixed(1)}% lower`}
          accent="amber"
        />
        <KpiCard
          icon="time"
          label="Execution Time Saved"
          value={toMs(Math.max(0, baselineRow.executionTimeMs - model.adaptive.executionTimeMs))}
          sub={`${(executionTimeSavedPct * 100).toFixed(1)}% faster`}
          accent="blue"
        />
        <KpiCard
          icon="route"
          label="Requests Routed"
          value={String(summary?.totalRequests ?? history.length)}
          sub={`Window ${windowSize} | Success ${toPct(metrics?.successRate)}`}
          accent="violet"
        />
        <KpiCard
          icon="dist"
          label="Route Distribution"
          value={routeLegend.length ? `${routeLegend.length} paths` : "0 paths"}
          sub={`Skill ${toPct((summary?.skillUsagePct ?? 0) / 100)} | Agent ${toPct((summary?.agentUsagePct ?? 0) / 100)}`}
          accent="teal"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.5fr,1fr]">
        <article className="rounded-xl border border-slate-700/90 bg-slate-950/55 p-4">
          <h3 className="text-sm font-semibold">Execution Comparison Matrix</h3>
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="text-slate-300">
                <tr>
                  <th className="px-2 py-1">Execution Model</th>
                  <th className="px-2 py-1">Estimated Cost</th>
                  <th className="px-2 py-1">Estimated Tokens</th>
                  <th className="px-2 py-1">Latency</th>
                  <th className="px-2 py-1">Execution Time</th>
                  <th className="px-2 py-1">Confidence</th>
                  <th className="px-2 py-1">Savings</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row) => {
                  const savings = row.name === "Adaptive AIO" ? moneySavedPct : 0;
                  return (
                    <tr key={row.name} className="border-t border-slate-700">
                      <td className="px-2 py-2">
                        <span
                          className={`rounded-full px-2 py-0.5 font-semibold ${
                            row.name === "Adaptive AIO"
                              ? "bg-emerald-500/20 text-emerald-200"
                              : row.name === "Always Agent"
                                ? "bg-amber-500/20 text-amber-200"
                                : "bg-indigo-500/20 text-indigo-200"
                          }`}
                        >
                          {row.name}
                        </span>
                      </td>
                      <td className="px-2 py-2">{toUsd(row.estimatedCost)}</td>
                      <td className="px-2 py-2">{toInt(row.estimatedTokens)}</td>
                      <td className="px-2 py-2">{toMs(row.latencyMs)}</td>
                      <td className="px-2 py-2">{toMs(row.executionTimeMs)}</td>
                      <td className="px-2 py-2">{toPct(row.confidence)}</td>
                      <td className="px-2 py-2 font-semibold text-emerald-300">
                        {row.name === "Adaptive AIO" ? `${(savings * 100).toFixed(1)}%` : "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </article>

        <article className="rounded-xl border border-slate-700/90 bg-slate-950/55 p-4">
          <h3 className="text-sm font-semibold">Route Distribution</h3>
          <div className="mt-3 flex items-center gap-4">
            <div
              className="h-28 w-28 rounded-full border border-slate-700"
              style={{ background: donutGradient }}
              aria-label="Route distribution chart"
            />
            <ul className="flex-1 space-y-1 text-xs">
              {routeLegend.map((item) => (
                <li key={item.strategy} className="flex items-center justify-between">
                  <span className="truncate pr-2">{displayStrategy(item.strategy)}</span>
                  <span className="font-semibold">{item.percentage.toFixed(1)}%</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="mt-2 text-xs text-slate-300">
            Requests routed: {toInt(routeLegend.reduce((sum, item) => sum + item.count, 0))}
          </p>
        </article>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-xl border border-slate-700/90 bg-slate-950/55 p-4">
          <h3 className="text-sm font-semibold">Savings Charts</h3>
          <div className="mt-3 space-y-3">
            {savingsBars.map((bar) => (
              <div key={bar.label}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span>{bar.label}</span>
                  <span>{(bar.value * 100).toFixed(1)}%</span>
                </div>
                <div className="h-2 rounded bg-slate-800">
                  <div
                    className={`h-2 rounded ${bar.color} transition-all duration-700`}
                    style={{ width: `${Math.max(4, Math.min(100, bar.value * 100))}%` }}
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-300">{bar.sub}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-xl border border-slate-700/90 bg-slate-950/55 p-4">
          <h3 className="text-sm font-semibold">Requests Routed (By Path)</h3>
          <div className="mt-3 space-y-2">
            {routeLegend.map((route) => (
              <div key={route.strategy}>
                <div className="mb-1 flex justify-between text-xs">
                  <span>{displayStrategy(route.strategy)}</span>
                  <span>{route.count}</span>
                </div>
                <div className="h-2 rounded bg-slate-800">
                  <div
                    className="h-2 rounded bg-violet-400 transition-all duration-700"
                    style={{ width: `${Math.max(4, Math.min(100, route.percentage))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}

function KpiCard({
  label,
  value,
  sub,
  accent,
  icon,
}: {
  label: string;
  value: string;
  sub: string;
  accent: "emerald" | "cyan" | "amber" | "blue" | "violet" | "teal";
  icon: "money" | "token" | "speed" | "time" | "route" | "dist";
}) {
  const accentClass: Record<typeof accent, string> = {
    emerald: "border-emerald-300/30 bg-emerald-500/10",
    cyan: "border-cyan-300/30 bg-cyan-500/10",
    amber: "border-amber-300/30 bg-amber-500/10",
    blue: "border-blue-300/30 bg-blue-500/10",
    violet: "border-violet-300/30 bg-violet-500/10",
    teal: "border-teal-300/30 bg-teal-500/10",
  };

  return (
    <article className={`rounded-xl border p-3 ${accentClass[accent]}`}>
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-wide text-cyan-100/70">{label}</p>
        <MetricIcon icon={icon} />
      </div>
      <p className="mt-2 text-xl font-bold">{value}</p>
      <p className="mt-1 text-[11px] text-slate-300">{sub}</p>
    </article>
  );
}

function MetricIcon({ icon }: { icon: "money" | "token" | "speed" | "time" | "route" | "dist" }) {
  if (icon === "money") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4 text-emerald-200" fill="none" aria-hidden>
        <path d="M4 7h16v10H4V7Zm4 5h8M7 10h.01M17 14h.01" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    );
  }
  if (icon === "token") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4 text-cyan-200" fill="none" aria-hidden>
        <circle cx="8" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
        <circle cx="16" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
        <path d="M11 12h2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    );
  }
  if (icon === "speed") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4 text-amber-200" fill="none" aria-hidden>
        <path d="M4 14a8 8 0 1 1 16 0m-8 0 4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    );
  }
  if (icon === "time") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4 text-blue-200" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.7" />
        <path d="M12 8v4l2 2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    );
  }
  if (icon === "route") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4 text-violet-200" fill="none" aria-hidden>
        <path d="M5 6h6v4H5V6Zm8 8h6v4h-6v-4Zm-2-2 4-2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 text-teal-200" fill="none" aria-hidden>
      <path d="M12 4v8l6 3M12 12l-6 3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function buildBenchmarkModel(history: OrchestrationResultDto[], traces: ExecutionTraceSnapshotDto[]) {
  const safeHistory = history.length > 0 ? history : [];
  const adaptive = {
    name: "Adaptive AIO" as const,
    estimatedCost: average(safeHistory.map((item) => item.estimatedUsd), 0.002),
    estimatedTokens: average(safeHistory.map((item) => item.tokenUsage), 180),
    latencyMs: average(safeHistory.map((item) => item.latencyMs), 220),
    executionTimeMs: average(
      safeHistory.map((item) => findExecutionTimeMs(item.requestId, traces, item.latencyMs)),
      240,
    ),
    confidence: average(safeHistory.map((item) => item.confidence), 0.9),
  };

  const llmOnlyHistory = safeHistory.filter((item) =>
    item.strategy === "SMALL_LLM" || item.strategy === "MEDIUM_LLM" || item.strategy === "LARGE_LLM",
  );
  const traditional = {
    name: "Traditional AI" as const,
    estimatedCost: Math.max(0.06, average(llmOnlyHistory.map((item) => item.estimatedUsd), adaptive.estimatedCost * 1.9)),
    estimatedTokens: Math.max(2600, average(llmOnlyHistory.map((item) => item.tokenUsage), adaptive.estimatedTokens * 2.2)),
    latencyMs: Math.max(1500, average(llmOnlyHistory.map((item) => item.latencyMs), adaptive.latencyMs * 2)),
    executionTimeMs: Math.max(1600, average(llmOnlyHistory.map((item) => findExecutionTimeMs(item.requestId, traces, item.latencyMs)), adaptive.executionTimeMs * 2.15)),
    confidence: clamp(average(llmOnlyHistory.map((item) => item.confidence), adaptive.confidence + 0.01), 0.75, 0.95),
  };

  const agentHistory = safeHistory.filter(
    (item) => item.strategy === "SINGLE_AGENT" || item.strategy === "MULTI_AGENT_WORKFLOW",
  );
  const agent = {
    name: "Always Agent" as const,
    estimatedCost: Math.max(0.18, average(agentHistory.map((item) => item.estimatedUsd), adaptive.estimatedCost * 4.1)),
    estimatedTokens: Math.max(7000, average(agentHistory.map((item) => item.tokenUsage), adaptive.estimatedTokens * 4)),
    latencyMs: Math.max(4200, average(agentHistory.map((item) => item.latencyMs), adaptive.latencyMs * 3.6)),
    executionTimeMs: Math.max(4300, average(agentHistory.map((item) => findExecutionTimeMs(item.requestId, traces, item.latencyMs)), adaptive.executionTimeMs * 3.8)),
    confidence: clamp(average(agentHistory.map((item) => item.confidence), adaptive.confidence + 0.03), 0.78, 0.97),
  };

  return { adaptive, traditional, agent };
}

function fallbackRoutes(summary: ExecutionAnalyticsSummaryDto | null): RouteUsageDto[] {
  if (!summary) return [];
  return [
    { strategy: "DETERMINISTIC_CODE" as ExecutionStrategy, count: 0, percentage: summary.codeUsagePct ?? 0 },
    { strategy: "AI_SKILL" as ExecutionStrategy, count: 0, percentage: summary.skillUsagePct ?? 0 },
    { strategy: "SMALL_LLM" as ExecutionStrategy, count: 0, percentage: (summary.llmUsagePct ?? 0) / 3 },
    { strategy: "MEDIUM_LLM" as ExecutionStrategy, count: 0, percentage: (summary.llmUsagePct ?? 0) / 3 },
    { strategy: "LARGE_LLM" as ExecutionStrategy, count: 0, percentage: (summary.llmUsagePct ?? 0) / 3 },
    { strategy: "SINGLE_AGENT" as ExecutionStrategy, count: 0, percentage: (summary.agentUsagePct ?? 0) * 0.6 },
    { strategy: "MULTI_AGENT_WORKFLOW" as ExecutionStrategy, count: 0, percentage: (summary.agentUsagePct ?? 0) * 0.4 },
  ].filter((item) => item.percentage > 0);
}

function findExecutionTimeMs(
  requestId: string,
  traces: ExecutionTraceSnapshotDto[],
  fallbackLatency: number,
): number {
  const trace = traces.find((item) => item.requestId === requestId);
  if (!trace) return fallbackLatency;
  const start = Date.parse(trace.startedAt);
  const end = Date.parse(trace.completedAt);
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) {
    return fallbackLatency;
  }
  return end - start;
}

function toDonut(routes: RouteUsageDto[]): string {
  if (routes.length === 0) {
    return "conic-gradient(rgba(148,163,184,0.45) 0deg 360deg)";
  }
  const palette = [
    "#22d3ee",
    "#34d399",
    "#fbbf24",
    "#818cf8",
    "#f472b6",
    "#38bdf8",
    "#fb7185",
  ];
  let current = 0;
  const segments = routes.map((item, index) => {
    const start = current;
    const span = Math.max(0, (item.percentage / 100) * 360);
    current += span;
    return `${palette[index % palette.length]} ${start}deg ${current}deg`;
  });
  if (current < 360) {
    segments.push(`rgba(148,163,184,0.3) ${current}deg 360deg`);
  }
  return `conic-gradient(${segments.join(",")})`;
}

function displayStrategy(strategy: ExecutionStrategy): string {
  if (strategy === "DETERMINISTIC_CODE") return "CODE";
  if (strategy === "AI_SKILL") return "SKILL";
  if (strategy === "SINGLE_AGENT") return "AGENT";
  if (strategy === "MULTI_AGENT_WORKFLOW") return "MULTI_AGENT";
  return strategy;
}

function average(values: number[], fallback: number): number {
  if (values.length === 0) return fallback;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function ratio(current: number, baseline: number): number {
  if (baseline <= 0) return 0;
  return clamp((baseline - current) / baseline, 0, 1);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function toUsd(value: number) {
  return `$${value.toFixed(4)}`;
}

function toMs(value: number) {
  return `${Math.round(value)} ms`;
}

function toInt(value: number) {
  return `${Math.round(value)}`;
}

function toPct(value?: number) {
  return `${((value ?? 0) * 100).toFixed(1)}%`;
}
