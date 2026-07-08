import { useMemo, useState } from "react";
import { ExecutionStrategy, OrchestrationResultDto } from "../../../shared/contracts/orchestration.contracts";
import { StrategyBadge } from "./StrategyBadge";

export type DemoScenario = {
  id: string;
  title: string;
  prompt: string;
  category: string;
  difficulty: "easy" | "medium" | "complex";
  baselineCost: number;
  baselineLatencyMs: number;
  summary: string;
};

type DemoCenterProps = {
  loading: boolean;
  onRunScenario: (scenario: DemoScenario) => Promise<OrchestrationResultDto | null>;
};

type ScenarioRunState = {
  status: "idle" | "running" | "success" | "failed";
  strategy?: ExecutionStrategy;
  cost?: number;
  latencyMs?: number;
  confidence?: number;
  costSavings?: number;
  latencySavingsMs?: number;
  requestId?: string;
};

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: "validate-json",
    title: "Validate JSON",
    prompt: "Validate this JSON payload and return whether required keys id, type, and timestamp exist.",
    category: "coding",
    difficulty: "easy",
    baselineCost: 0.18,
    baselineLatencyMs: 4300,
    summary: "Simple deterministic validation workload.",
  },
  {
    id: "generate-sql",
    title: "Generate SQL",
    prompt: "Generate a PostgreSQL query to find top 5 customers by total order value in the last 90 days.",
    category: "sql",
    difficulty: "medium",
    baselineCost: 0.18,
    baselineLatencyMs: 4300,
    summary: "Structured generation with moderate reasoning.",
  },
  {
    id: "translate-text",
    title: "Translate Text",
    prompt: "Translate this paragraph from English to French while preserving formal business tone.",
    category: "translation",
    difficulty: "easy",
    baselineCost: 0.18,
    baselineLatencyMs: 4300,
    summary: "High-throughput low-cost linguistic transformation.",
  },
  {
    id: "summarize-report",
    title: "Summarize Report",
    prompt: "Summarize the quarterly operations report into 7 executive bullet points with key risks.",
    category: "summarization",
    difficulty: "medium",
    baselineCost: 0.18,
    baselineLatencyMs: 4300,
    summary: "Condensed synthesis with executive framing.",
  },
  {
    id: "draft-email",
    title: "Draft Email",
    prompt: "Draft a concise escalation email to stakeholders about delayed API integration and next actions.",
    category: "email",
    difficulty: "easy",
    baselineCost: 0.18,
    baselineLatencyMs: 4300,
    summary: "Template-friendly business communication.",
  },
  {
    id: "travel-planner",
    title: "Travel Planner",
    prompt: "Plan a 5-day business trip to Tokyo including flight, hotel options, commute estimates, and itinerary.",
    category: "travel",
    difficulty: "complex",
    baselineCost: 0.22,
    baselineLatencyMs: 4800,
    summary: "Multi-step planning with contextual constraints.",
  },
  {
    id: "enterprise-architecture-review",
    title: "Enterprise Architecture Review",
    prompt: "Review this enterprise platform architecture and propose phased migration strategy with risks and controls.",
    category: "reasoning",
    difficulty: "complex",
    baselineCost: 0.34,
    baselineLatencyMs: 9100,
    summary: "Deep planning workload often requiring multi-agent orchestration.",
  },
  {
    id: "research-topic",
    title: "Research Topic",
    prompt: "Research current best practices for zero-downtime data migration in cloud-native systems.",
    category: "research",
    difficulty: "complex",
    baselineCost: 0.22,
    baselineLatencyMs: 5000,
    summary: "High-context synthesis and reasoning.",
  },
  {
    id: "medical-summary",
    title: "Medical Summary",
    prompt: "Summarize this patient case notes into clinical observations, likely diagnosis themes, and follow-up checks.",
    category: "medical",
    difficulty: "complex",
    baselineCost: 0.22,
    baselineLatencyMs: 5000,
    summary: "Sensitive domain summarization with higher privacy requirements.",
  },
  {
    id: "financial-analysis",
    title: "Financial Analysis",
    prompt: "Analyze Q4 revenue and expense trends, identify anomalies, and suggest 3 strategic cost optimizations.",
    category: "finance",
    difficulty: "complex",
    baselineCost: 0.22,
    baselineLatencyMs: 5000,
    summary: "Analytical reasoning over business metrics.",
  },
];

export function DemoCenter({ loading, onRunScenario }: DemoCenterProps) {
  const [runs, setRuns] = useState<Record<string, ScenarioRunState>>({});
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);
  const [runningAll, setRunningAll] = useState(false);
  const [presentationMode, setPresentationMode] = useState(false);
  const [presentationIndex, setPresentationIndex] = useState(0);

  const progress = useMemo(() => {
    const done = DEMO_SCENARIOS.filter((scenario) => runs[scenario.id]?.status === "success").length;
    return {
      done,
      total: DEMO_SCENARIOS.length,
      pct: (done / DEMO_SCENARIOS.length) * 100,
    };
  }, [runs]);

  const totals = useMemo(() => {
    const allRuns = Object.values(runs);
    return {
      moneySaved: allRuns.reduce((sum, run) => sum + (run.costSavings ?? 0), 0),
      latencySavedMs: allRuns.reduce((sum, run) => sum + (run.latencySavingsMs ?? 0), 0),
      completed: allRuns.filter((run) => run.status === "success").length,
    };
  }, [runs]);

  const currentPresentationScenario = DEMO_SCENARIOS[presentationIndex];
  const currentRun = currentPresentationScenario ? runs[currentPresentationScenario.id] : undefined;

  async function executeScenario(scenario: DemoScenario): Promise<void> {
    setActiveScenarioId(scenario.id);
    setRuns((previous) => ({
      ...previous,
      [scenario.id]: { ...(previous[scenario.id] ?? {}), status: "running" },
    }));

    const result = await onRunScenario(scenario);
    if (result) {
      const costSavings = Math.max(0, scenario.baselineCost - result.actualUsd);
      const latencySavingsMs = Math.max(0, scenario.baselineLatencyMs - result.latencyMs);
      setRuns((previous) => ({
        ...previous,
        [scenario.id]: {
          status: "success",
          strategy: result.strategy,
          cost: result.actualUsd,
          latencyMs: result.latencyMs,
          confidence: result.confidence,
          costSavings,
          latencySavingsMs,
          requestId: result.requestId,
        },
      }));
    } else {
      setRuns((previous) => ({
        ...previous,
        [scenario.id]: { ...(previous[scenario.id] ?? {}), status: "failed" },
      }));
    }
    setActiveScenarioId(null);
  }

  async function runAllScenarios() {
    if (runningAll) return;
    setRunningAll(true);
    for (let index = 0; index < DEMO_SCENARIOS.length; index += 1) {
      const scenario = DEMO_SCENARIOS[index];
      setPresentationIndex(index);
      await executeScenario(scenario);
      await delay(presentationMode ? 900 : 250);
    }
    setRunningAll(false);
  }

  return (
    <section className="rounded-2xl border border-cyan-200/20 bg-slate-900/60 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Demo Center</h2>
          <p className="text-xs text-cyan-100/75">
            One-click enterprise scenarios with live routing, savings, and hackathon presentation mode.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={runAllScenarios}
            disabled={runningAll || loading}
            className="rounded-lg bg-cyan-500 px-3 py-2 text-xs font-semibold text-slate-900 transition hover:bg-cyan-400 disabled:opacity-60"
          >
            {runningAll ? "Running All..." : "Run All Scenarios"}
          </button>
          <button
            type="button"
            onClick={() => setPresentationMode((value) => !value)}
            className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
              presentationMode
                ? "border-fuchsia-300 bg-fuchsia-400/20 text-fuchsia-100"
                : "border-slate-500 bg-slate-900/70 text-slate-200"
            }`}
          >
            {presentationMode ? "Exit Presentation Mode" : "Presentation Mode"}
          </button>
        </div>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-4">
        <KpiMiniCard label="Completed" value={`${totals.completed}/${DEMO_SCENARIOS.length}`} />
        <KpiMiniCard label="Money Saved" value={toUsd(totals.moneySaved)} />
        <KpiMiniCard label="Latency Saved" value={toMs(totals.latencySavedMs)} />
        <KpiMiniCard label="Run Progress" value={`${progress.pct.toFixed(0)}%`} />
      </div>

      <div className="mt-3 h-2 rounded bg-slate-800">
        <div
          className="h-2 rounded bg-gradient-to-r from-cyan-400 via-emerald-300 to-fuchsia-300 transition-all duration-700"
          style={{ width: `${Math.max(2, progress.pct)}%` }}
        />
      </div>

      {presentationMode && currentPresentationScenario && (
        <article className="mt-4 rounded-2xl border border-fuchsia-300/30 bg-gradient-to-r from-fuchsia-500/12 via-cyan-500/8 to-emerald-500/10 p-4 shadow-[0_16px_42px_rgba(30,41,59,0.55)]">
          <p className="text-[11px] uppercase tracking-wide text-fuchsia-100/80">Hackathon Presentation Mode</p>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-bold text-slate-100">{currentPresentationScenario.title}</h3>
              <p className="mt-1 text-sm text-slate-200/90">{currentPresentationScenario.summary}</p>
            </div>
            <span className="rounded-full border border-slate-200/20 bg-slate-900/70 px-3 py-1 text-xs font-semibold text-cyan-100">
              Scenario {presentationIndex + 1} / {DEMO_SCENARIOS.length}
            </span>
          </div>
          <p className="mt-3 text-sm text-slate-100/90">{currentPresentationScenario.prompt}</p>
          <div className="mt-3 grid gap-2 md:grid-cols-4">
            <PresentationMetric label="Status" value={statusLabel(currentRun?.status)} />
            <PresentationMetric label="Route" value={currentRun?.strategy ? currentRun.strategy.replaceAll("_", " ") : "-"} />
            <PresentationMetric label="Cost Saved" value={toUsd(currentRun?.costSavings ?? 0)} />
            <PresentationMetric label="Latency Saved" value={toMs(currentRun?.latencySavingsMs ?? 0)} />
          </div>
        </article>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {DEMO_SCENARIOS.map((scenario, index) => {
          const run = runs[scenario.id];
          const isActive = activeScenarioId === scenario.id;
          return (
            <article
              key={scenario.id}
              className={`rounded-xl border p-3 transition ${
                isActive
                  ? "border-cyan-300/50 bg-cyan-400/10"
                  : run?.status === "success"
                    ? "border-emerald-300/35 bg-emerald-400/10"
                    : run?.status === "failed"
                      ? "border-rose-300/35 bg-rose-400/10"
                      : "border-slate-700 bg-slate-950/45"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-slate-100">{scenario.title}</h3>
                  <p className="mt-1 text-[11px] text-slate-300">{scenario.summary}</p>
                </div>
                <span className="rounded-full border border-slate-500 px-2 py-0.5 text-[10px] text-slate-200">
                  #{index + 1}
                </span>
              </div>

              <div
                className="mt-2 text-[11px] text-slate-200/90"
                style={{
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {scenario.prompt}
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-slate-300">
                <span className="rounded-full border border-slate-600 px-2 py-0.5">{scenario.category}</span>
                <span className="rounded-full border border-slate-600 px-2 py-0.5">{scenario.difficulty}</span>
                <span className="rounded-full border border-slate-600 px-2 py-0.5">
                  Baseline {toUsd(scenario.baselineCost)}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusClass(run?.status)}`}>
                  {statusLabel(run?.status)}
                </span>
                {run?.strategy && <StrategyBadge strategy={run.strategy} />}
              </div>

              <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
                <StatCell label="Cost" value={toUsd(run?.cost ?? 0)} />
                <StatCell label="Latency" value={toMs(run?.latencyMs ?? 0)} />
                <StatCell label="Cost Savings" value={toUsd(run?.costSavings ?? 0)} />
                <StatCell label="Latency Savings" value={toMs(run?.latencySavingsMs ?? 0)} />
              </div>

              <button
                type="button"
                disabled={loading || runningAll}
                onClick={() => {
                  setPresentationIndex(index);
                  void executeScenario(scenario);
                }}
                className="mt-3 w-full rounded-lg border border-cyan-300/30 bg-cyan-500/20 px-3 py-1.5 text-xs font-semibold text-cyan-50 transition hover:bg-cyan-500/35 disabled:opacity-60"
              >
                {isActive ? "Running..." : `Run ${scenario.title}`}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function KpiMiniCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-lg border border-slate-600/70 bg-slate-950/60 p-3">
      <p className="text-[10px] uppercase tracking-wide text-cyan-100/70">{label}</p>
      <p className="mt-1 text-sm font-bold text-slate-100">{value}</p>
    </article>
  );
}

function PresentationMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-fuchsia-200/20 bg-slate-900/55 p-2">
      <p className="text-[10px] uppercase tracking-wide text-fuchsia-100/80">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-100">{value}</p>
    </div>
  );
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-1.5">
      <p className="text-[10px] text-slate-300">{label}</p>
      <p className="text-xs font-semibold text-slate-100">{value}</p>
    </div>
  );
}

function statusClass(status?: ScenarioRunState["status"]): string {
  if (status === "success") return "bg-emerald-400 text-slate-900";
  if (status === "running") return "bg-cyan-400 text-slate-900";
  if (status === "failed") return "bg-rose-400 text-slate-900";
  return "bg-slate-700 text-slate-200";
}

function statusLabel(status?: ScenarioRunState["status"]): string {
  if (status === "success") return "Completed";
  if (status === "running") return "Running";
  if (status === "failed") return "Failed";
  return "Idle";
}

function toUsd(value: number) {
  return `$${value.toFixed(4)}`;
}

function toMs(value: number) {
  return `${Math.round(value)} ms`;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}
