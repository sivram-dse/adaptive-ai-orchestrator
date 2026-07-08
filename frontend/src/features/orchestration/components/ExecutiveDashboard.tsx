import { useEffect, useMemo, useState } from "react";
import { HttpOrchestrationApi } from "../api/HttpOrchestrationApi";
import {
  ExecutionAnalyticsSummaryDto,
  ExecutionTraceMetricsDto,
  OrchestrationResultDto,
  RouteUsageDto,
  ScenarioBenchmarkResultDto,
} from "../../../shared/contracts/orchestration.contracts";

const agentBaselineCost = 0.18;
const agentBaselineLatency = 4300;

export function ExecutiveDashboard() {
  const api = useMemo(() => new HttpOrchestrationApi(), []);
  const [summary, setSummary] = useState<ExecutionAnalyticsSummaryDto | null>(null);
  const [metrics, setMetrics] = useState<ExecutionTraceMetricsDto | null>(null);
  const [routes, setRoutes] = useState<RouteUsageDto[]>([]);
  const [history, setHistory] = useState<OrchestrationResultDto[]>([]);
  const [scenarios, setScenarios] = useState<ScenarioBenchmarkResultDto[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(false), 7000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refresh(withScenarios = true) {
    try {
      const [nextSummary, nextMetrics, nextRoutes, nextHistory] = await Promise.all([
        api.getSummary(),
        api.getMetrics(),
        api.getRouteUsage(),
        api.getHistory(30),
      ]);
      setSummary(nextSummary);
      setMetrics(nextMetrics);
      setRoutes(nextRoutes);
      setHistory(nextHistory);
      if (withScenarios) {
        setScenarios(await api.getScenarios());
      }
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const derived = useMemo(() => {
    const averageCost = summary?.averageCost ?? 0;
    const averageLatency = summary?.averageLatencyMs ?? 0;
    const savingsVsAgentPct = percentSaved(agentBaselineCost, averageCost);
    const latencySavedPct = percentSaved(agentBaselineLatency, averageLatency);
    const requestCount = summary?.totalRequests ?? history.length;
    return {
      averageCost,
      averageLatency,
      savingsVsAgentPct,
      latencySavedPct,
      requestCount,
    };
  }, [summary, history.length]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 p-4 text-slate-100 md:p-6">
      <section className="mx-auto max-w-7xl space-y-4">
        <header className="rounded-2xl border border-cyan-200/20 bg-slate-900/60 p-5 shadow-xl backdrop-blur-sm">
          <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">Executive Dashboard</h1>
          <p className="mt-2 text-sm text-cyan-100/80">
            Executive view of routing intelligence, operating efficiency, and benchmark savings.
          </p>
          {error && <p className="mt-2 text-xs text-rose-300">{error}</p>}
        </header>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <KpiCard label="Total Requests" value={String(derived.requestCount)} accent="cyan" />
          <KpiCard label="Avg Cost" value={toUsd(derived.averageCost)} accent="emerald" />
          <KpiCard label="Avg Latency" value={toMs(derived.averageLatency)} accent="amber" />
          <KpiCard label="Success Rate" value={toPct(summary?.successRate)} accent="blue" />
          <KpiCard label="Cost Savings vs Agent" value={`${(derived.savingsVsAgentPct * 100).toFixed(1)}%`} accent="violet" />
          <KpiCard label="Latency Savings vs Agent" value={`${(derived.latencySavedPct * 100).toFixed(1)}%`} accent="teal" />
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.2fr,1fr]">
          <article className="rounded-2xl border border-cyan-200/20 bg-slate-900/60 p-5">
            <h2 className="font-display text-lg font-semibold">Route Distribution</h2>
            <div className="mt-3 space-y-2">
              {routes.map((route) => (
                <div key={route.strategy}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span>{route.strategy.replaceAll("_", " ")}</span>
                    <span>{route.percentage.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 rounded bg-slate-800">
                    <div
                      className="h-2 rounded bg-gradient-to-r from-cyan-400 to-emerald-300 transition-all duration-700"
                      style={{ width: `${Math.max(4, Math.min(100, route.percentage))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-2xl border border-cyan-200/20 bg-slate-900/60 p-5">
            <h2 className="font-display text-lg font-semibold">Efficiency Indicators</h2>
            <div className="mt-3 space-y-3">
              <EfficiencyRow
                label="Cost Efficiency"
                value={derived.savingsVsAgentPct}
                subtitle={`${toUsd(summary?.savingsVsAlwaysAgent)} saved against always-agent baseline`}
                tone="emerald"
              />
              <EfficiencyRow
                label="Latency Efficiency"
                value={derived.latencySavedPct}
                subtitle={`${toMs(Math.max(0, agentBaselineLatency - derived.averageLatency))} faster vs baseline`}
                tone="amber"
              />
              <EfficiencyRow
                label="Reliability"
                value={metrics?.successRate ?? 0}
                subtitle={`Failure rate ${toPct(metrics?.failureRate)} across traces`}
                tone="cyan"
              />
            </div>
          </article>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border border-cyan-200/20 bg-slate-900/60 p-5">
            <h2 className="font-display text-lg font-semibold">Execution Timeline (Latest 12)</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-left text-xs">
                <thead className="text-slate-300">
                  <tr>
                    <th className="px-2 py-1">Time</th>
                    <th className="px-2 py-1">Path</th>
                    <th className="px-2 py-1">Cost</th>
                    <th className="px-2 py-1">Latency</th>
                    <th className="px-2 py-1">Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {history.slice(0, 12).map((item) => (
                    <tr key={item.requestId} className="border-t border-slate-700">
                      <td className="px-2 py-1">{new Date(item.executedAt).toLocaleTimeString()}</td>
                      <td className="px-2 py-1">{item.strategy.replaceAll("_", " ")}</td>
                      <td className="px-2 py-1">{toUsd(item.actualUsd)}</td>
                      <td className="px-2 py-1">{toMs(item.latencyMs)}</td>
                      <td className="px-2 py-1">{toPct(item.confidence)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <article className="rounded-2xl border border-cyan-200/20 bg-slate-900/60 p-5">
            <h2 className="font-display text-lg font-semibold">Scenario Benchmarks</h2>
            <div className="mt-3 space-y-2">
              {scenarios.slice(0, 6).map((scenario) => (
                <div key={scenario.scenarioId} className="rounded-lg border border-slate-700 bg-slate-950/50 p-2">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-slate-100">{scenario.scenarioName}</span>
                    <span className="text-emerald-300">{toUsd(scenario.savingsVsAlwaysAgent)} saved</span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-300">
                    {scenario.routedStrategy.replaceAll("_", " ")} | {toMs(scenario.actualLatencyMs)} |{" "}
                    {toUsd(scenario.actualCost)}
                  </p>
                </div>
              ))}
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}

function KpiCard({ label, value, accent }: { label: string; value: string; accent: "cyan" | "emerald" | "amber" | "blue" | "violet" | "teal" }) {
  const accentClass: Record<typeof accent, string> = {
    cyan: "border-cyan-300/30 bg-cyan-500/10",
    emerald: "border-emerald-300/30 bg-emerald-500/10",
    amber: "border-amber-300/30 bg-amber-500/10",
    blue: "border-blue-300/30 bg-blue-500/10",
    violet: "border-violet-300/30 bg-violet-500/10",
    teal: "border-teal-300/30 bg-teal-500/10",
  };
  return (
    <article className={`rounded-xl border p-4 ${accentClass[accent]}`}>
      <p className="text-xs uppercase tracking-wide text-cyan-100/70">{label}</p>
      <p className="mt-2 font-display text-2xl font-bold">{value}</p>
    </article>
  );
}

function EfficiencyRow({ label, value, subtitle, tone }: { label: string; value: number; subtitle: string; tone: "emerald" | "amber" | "cyan" }) {
  const barClass: Record<typeof tone, string> = {
    emerald: "bg-emerald-300",
    amber: "bg-amber-300",
    cyan: "bg-cyan-300",
  };
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span>{label}</span>
        <span>{(Math.max(0, Math.min(1, value)) * 100).toFixed(1)}%</span>
      </div>
      <div className="h-2 rounded bg-slate-800">
        <div
          className={`h-2 rounded ${barClass[tone]} transition-all duration-700`}
          style={{ width: `${Math.max(3, Math.min(100, value * 100))}%` }}
        />
      </div>
      <p className="mt-1 text-[11px] text-slate-300">{subtitle}</p>
    </div>
  );
}

function percentSaved(baseline: number, actual: number): number {
  if (baseline <= 0) return 0;
  return Math.max(0, Math.min(1, (baseline - actual) / baseline));
}

function toUsd(value?: number) {
  return `$${(value ?? 0).toFixed(4)}`;
}

function toMs(value?: number) {
  return `${Math.round(value ?? 0)} ms`;
}

function toPct(value?: number) {
  return `${((value ?? 0) * 100).toFixed(1)}%`;
}
