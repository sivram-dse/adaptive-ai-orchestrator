import { useMemo } from "react";
import { ExecutionStrategy, OrchestrationResultDto } from "../../../shared/contracts/orchestration.contracts";
import { StrategyBadge } from "./StrategyBadge";

type ExplainableAIPanelProps = {
  prompt: string;
  category: string;
  difficulty: string;
  result: OrchestrationResultDto | null;
};

type SignalSnapshot = {
  complexity: number;
  reasoningDepth: number;
  contextSize: number;
  externalToolRequirement: number;
  privacyRequirement: number;
  estimatedCost: number;
  estimatedLatencyMs: number;
  confidence: number;
  decisionScore: number;
};

type StrategyProfile = {
  baseCost: number;
  baseLatencyMs: number;
  reasoningCapacity: number;
  supportsTools: boolean;
  privacyFit: number;
};

type AlternativeInsight = {
  strategy: ExecutionStrategy;
  score: number;
  reasons: string[];
  severity: "high" | "medium" | "low";
};

const strategyProfiles: Record<ExecutionStrategy, StrategyProfile> = {
  DETERMINISTIC_CODE: { baseCost: 0.0001, baseLatencyMs: 85, reasoningCapacity: 0.2, supportsTools: false, privacyFit: 0.95 },
  AI_SKILL: { baseCost: 0.0023, baseLatencyMs: 210, reasoningCapacity: 0.35, supportsTools: false, privacyFit: 0.85 },
  SMALL_LLM: { baseCost: 0.008, baseLatencyMs: 650, reasoningCapacity: 0.48, supportsTools: false, privacyFit: 0.62 },
  MEDIUM_LLM: { baseCost: 0.025, baseLatencyMs: 1350, reasoningCapacity: 0.66, supportsTools: true, privacyFit: 0.58 },
  LARGE_LLM: { baseCost: 0.082, baseLatencyMs: 2380, reasoningCapacity: 0.82, supportsTools: true, privacyFit: 0.55 },
  SINGLE_AGENT: { baseCost: 0.18, baseLatencyMs: 4350, reasoningCapacity: 0.92, supportsTools: true, privacyFit: 0.53 },
  MULTI_AGENT_WORKFLOW: { baseCost: 0.34, baseLatencyMs: 9150, reasoningCapacity: 0.99, supportsTools: true, privacyFit: 0.5 },
};

const metricCards: Array<{
  key: keyof SignalSnapshot;
  label: string;
  kind: "percent" | "cost" | "latency" | "score" | "recommendation";
}> = [
  { key: "complexity", label: "Complexity", kind: "percent" },
  { key: "reasoningDepth", label: "Reasoning Depth", kind: "percent" },
  { key: "contextSize", label: "Context Size", kind: "percent" },
  { key: "externalToolRequirement", label: "External Tool Requirement", kind: "percent" },
  { key: "privacyRequirement", label: "Privacy Requirement", kind: "percent" },
  { key: "estimatedCost", label: "Estimated Cost", kind: "cost" },
  { key: "estimatedLatencyMs", label: "Estimated Latency", kind: "latency" },
  { key: "confidence", label: "Confidence", kind: "percent" },
  { key: "decisionScore", label: "Decision Score", kind: "score" },
];

export function ExplainableAIPanel({ prompt, category, difficulty, result }: ExplainableAIPanelProps) {
  const explanation = useMemo(
    () => buildExplanation(prompt, category, difficulty, result),
    [prompt, category, difficulty, result],
  );

  if (!result) {
    return (
      <article className="rounded-2xl border border-cyan-200/20 bg-slate-900/60 p-5">
        <h2 className="text-lg font-semibold">Explainable AI Panel</h2>
        <p className="mt-2 text-sm text-slate-300">
          Run orchestration for a request to view path-level reasoning, evaluation cards, and rejected alternatives.
        </p>
      </article>
    );
  }

  return (
    <article className="rounded-2xl border border-cyan-200/20 bg-slate-900/60 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Explainable AI Panel</h2>
        <StrategyBadge strategy={result.strategy} />
      </div>

      <div className="mt-2 rounded-xl border border-cyan-300/30 bg-cyan-400/10 p-3 text-sm text-cyan-50">
        <p className="font-semibold">Why this path was selected</p>
        <p className="mt-1 text-cyan-100/90">{explanation.selectionReason}</p>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {metricCards.map((card) => (
          <MetricIndicatorCard
            key={card.key}
            label={card.label}
            value={formatMetricValue(explanation.signal[card.key], card.kind)}
            indicatorPercent={toIndicatorPercent(explanation.signal[card.key], card.kind)}
            tone={toneByMetric(card.key, explanation.signal[card.key])}
          />
        ))}
        <RecommendationCard recommendation={explanation.recommendation} />
      </div>

      <section className="mt-4">
        <h3 className="text-sm font-semibold">Why alternative execution paths were rejected</h3>
        <div className="mt-2 space-y-2">
          {explanation.alternatives.map((alternative) => (
            <AlternativeCard key={alternative.strategy} item={alternative} selectedScore={explanation.signal.decisionScore} />
          ))}
        </div>
      </section>
    </article>
  );
}

function MetricIndicatorCard({
  label,
  value,
  indicatorPercent,
  tone,
}: {
  label: string;
  value: string;
  indicatorPercent: number;
  tone: "calm" | "warn" | "alert";
}) {
  const toneClass: Record<typeof tone, string> = {
    calm: "border-emerald-300/25 bg-emerald-400/10",
    warn: "border-amber-300/25 bg-amber-400/10",
    alert: "border-rose-300/25 bg-rose-400/10",
  };
  const barClass: Record<typeof tone, string> = {
    calm: "bg-emerald-300",
    warn: "bg-amber-300",
    alert: "bg-rose-300",
  };

  return (
    <article className={`rounded-xl border p-3 ${toneClass[tone]}`}>
      <p className="text-[11px] uppercase tracking-wide text-slate-200/85">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-100">{value}</p>
      <div className="mt-2 h-1.5 rounded bg-slate-800">
        <div
          className={`h-1.5 rounded ${barClass[tone]} transition-all duration-500`}
          style={{ width: `${Math.max(3, Math.min(100, indicatorPercent))}%` }}
        />
      </div>
    </article>
  );
}

function RecommendationCard({ recommendation }: { recommendation: string }) {
  return (
    <article className="rounded-xl border border-indigo-300/30 bg-indigo-400/10 p-3 sm:col-span-2 xl:col-span-3">
      <p className="text-[11px] uppercase tracking-wide text-indigo-100/90">Recommendation</p>
      <p className="mt-1 text-sm text-indigo-50">{recommendation}</p>
    </article>
  );
}

function AlternativeCard({
  item,
  selectedScore,
}: {
  item: AlternativeInsight;
  selectedScore: number;
}) {
  const severityClass: Record<AlternativeInsight["severity"], string> = {
    high: "border-rose-300/35 bg-rose-400/10",
    medium: "border-amber-300/35 bg-amber-400/10",
    low: "border-slate-500/40 bg-slate-800/60",
  };

  return (
    <article className={`rounded-xl border p-3 ${severityClass[item.severity]}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-100">{item.strategy.replaceAll("_", " ")}</p>
        <span className="rounded-full border border-slate-500 px-2 py-0.5 text-[11px] text-slate-100">
          Score {item.score.toFixed(3)} ({scoreDeltaText(selectedScore, item.score)})
        </span>
      </div>
      <ul className="mt-2 space-y-1 text-xs text-slate-200/90">
        {item.reasons.map((reason) => (
          <li key={reason} className="flex items-start gap-2">
            <span className="mt-[2px] h-1.5 w-1.5 rounded-full bg-slate-200/80" />
            <span>{reason}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

function buildExplanation(
  prompt: string,
  category: string,
  difficulty: string,
  result: OrchestrationResultDto | null,
): {
  signal: SignalSnapshot;
  selectionReason: string;
  alternatives: AlternativeInsight[];
  recommendation: string;
} {
  const signal = buildSignalSnapshot(prompt, category, difficulty, result);
  const selectedProfile = strategyProfiles[result!.strategy];
  const selectedScore = signal.decisionScore;
  const rationale = result?.rationale?.trim() || "This path balanced cost, latency, and confidence better than alternatives.";

  const alternatives = Object.entries(result!.decisionScores ?? {})
    .filter(([strategy]) => strategy !== result!.strategy)
    .map(([strategy, score]) => {
      const typedStrategy = strategy as ExecutionStrategy;
      return {
        strategy: typedStrategy,
        score,
        reasons: buildRejectionReasons(typedStrategy, signal, result!.strategy, score, selectedScore),
        severity: computeSeverity(typedStrategy, signal, score, selectedScore),
      } as AlternativeInsight;
    })
    .sort((a, b) => b.score - a.score);

  const recommendation = `Keep ${result!.strategy.replaceAll("_", " ")} for similar requests. ${recommendationHint(
    signal,
    selectedProfile,
  )}`;

  return {
    signal,
    selectionReason: rationale,
    alternatives,
    recommendation,
  };
}

function buildSignalSnapshot(
  prompt: string,
  category: string,
  difficulty: string,
  result: OrchestrationResultDto | null,
): SignalSnapshot {
  const diff = difficulty.toLowerCase();
  const difficultyBase = diff === "complex" ? 0.82 : diff === "medium" ? 0.52 : 0.24;
  const contextSize = clamp((prompt.length + prompt.split(/\s+/).length * 3) / 620, 0.08, 1);
  const privacyRequirement = privacyWeight(category);
  const complexity = clamp(difficultyBase * 0.6 + contextSize * 0.28 + privacyRequirement * 0.12, 0.04, 1);
  const reasoningDepth = clamp(difficultyBase * 0.86 + contextSize * 0.14, 0.05, 1);
  const externalToolRequirement = clamp(toolRequirement(prompt, category), 0, 1);
  const confidence = result ? result.confidence : clamp(0.95 - complexity * 0.3, 0.5, 0.98);

  const decisionScore = result
    ? result.decisionScores[result.strategy] ?? highestScore(result.decisionScores)
    : 0.7;

  return {
    complexity,
    reasoningDepth,
    contextSize,
    externalToolRequirement,
    privacyRequirement,
    estimatedCost: result?.estimatedUsd ?? 0,
    estimatedLatencyMs: result?.latencyMs ?? 0,
    confidence,
    decisionScore,
  };
}

function buildRejectionReasons(
  strategy: ExecutionStrategy,
  signal: SignalSnapshot,
  selected: ExecutionStrategy,
  alternativeScore: number,
  selectedScore: number,
): string[] {
  const reasons: string[] = [];
  const candidate = strategyProfiles[strategy];
  const winner = strategyProfiles[selected];

  if (alternativeScore < selectedScore) {
    reasons.push(`Lower decision score than selected path by ${(selectedScore - alternativeScore).toFixed(3)}.`);
  }
  if (candidate.baseCost > winner.baseCost * 1.4) {
    reasons.push("Higher projected execution cost for this request profile.");
  }
  if (candidate.baseLatencyMs > winner.baseLatencyMs * 1.45) {
    reasons.push("Higher latency profile than chosen route.");
  }
  if (signal.reasoningDepth > candidate.reasoningCapacity + 0.08) {
    reasons.push("Insufficient reasoning depth capacity for expected complexity.");
  } else if (signal.reasoningDepth + 0.25 < candidate.reasoningCapacity && candidate.baseCost > winner.baseCost) {
    reasons.push("Over-provisioned reasoning capacity relative to required depth.");
  }
  if (signal.externalToolRequirement > 0.52 && !candidate.supportsTools) {
    reasons.push("Tool orchestration capability is limited for likely external dependencies.");
  }
  if (signal.privacyRequirement > 0.72 && candidate.privacyFit < winner.privacyFit) {
    reasons.push("Weaker privacy fit under current data sensitivity requirements.");
  }
  if (reasons.length === 0) {
    reasons.push("Rejected due to weaker overall efficiency-confidence tradeoff.");
  }
  return reasons;
}

function computeSeverity(
  strategy: ExecutionStrategy,
  signal: SignalSnapshot,
  alternativeScore: number,
  selectedScore: number,
): "high" | "medium" | "low" {
  const profile = strategyProfiles[strategy];
  if (selectedScore - alternativeScore > 0.22 || profile.baseCost > signal.estimatedCost * 3) {
    return "high";
  }
  if (selectedScore - alternativeScore > 0.1 || profile.baseLatencyMs > signal.estimatedLatencyMs * 1.7) {
    return "medium";
  }
  return "low";
}

function recommendationHint(signal: SignalSnapshot, selectedProfile: StrategyProfile): string {
  if (signal.externalToolRequirement > 0.65) {
    return "Tool demand is elevated; keep a tool-capable fallback if confidence drops.";
  }
  if (signal.privacyRequirement > 0.75 && selectedProfile.privacyFit < 0.7) {
    return "Consider tighter privacy controls and redaction guards for sensitive payloads.";
  }
  if (signal.complexity < 0.3 && signal.estimatedCost > 0.01) {
    return "Complexity remains low, so validate if a cheaper CODE/SKILL route can satisfy quality.";
  }
  return "Current route offers a strong cost-latency-confidence balance for this request type.";
}

function toneByMetric(key: keyof SignalSnapshot, value: number): "calm" | "warn" | "alert" {
  if (key === "estimatedCost") {
    if (value > 0.08) return "alert";
    if (value > 0.02) return "warn";
    return "calm";
  }
  if (key === "estimatedLatencyMs") {
    if (value > 3500) return "alert";
    if (value > 1300) return "warn";
    return "calm";
  }
  if (key === "confidence") {
    if (value < 0.72) return "alert";
    if (value < 0.85) return "warn";
    return "calm";
  }
  if (key === "decisionScore") {
    if (value < 0.55) return "alert";
    if (value < 0.72) return "warn";
    return "calm";
  }
  if (value > 0.8) return "alert";
  if (value > 0.5) return "warn";
  return "calm";
}

function formatMetricValue(value: number, kind: "percent" | "cost" | "latency" | "score" | "recommendation"): string {
  if (kind === "cost") return `$${value.toFixed(4)}`;
  if (kind === "latency") return `${Math.round(value)} ms`;
  if (kind === "score") return value.toFixed(3);
  return `${Math.round(value * 100)}%`;
}

function toIndicatorPercent(value: number, kind: "percent" | "cost" | "latency" | "score" | "recommendation"): number {
  if (kind === "cost") return clamp((value / 0.25) * 100, 1, 100);
  if (kind === "latency") return clamp((value / 9000) * 100, 1, 100);
  if (kind === "score") return clamp(value * 100, 1, 100);
  return clamp(value * 100, 1, 100);
}

function toolRequirement(prompt: string, category: string): number {
  const text = `${prompt} ${category}`.toLowerCase();
  const keywords = ["research", "search", "latest", "book", "api", "tool", "crawl", "integration", "migrate", "plan"];
  const hitCount = keywords.reduce((count, keyword) => count + (text.includes(keyword) ? 1 : 0), 0);
  const categoryBoost = category === "travel" || category === "research" || category === "analytics" || category === "sql" ? 0.25 : 0;
  return clamp(hitCount * 0.11 + categoryBoost, 0, 1);
}

function privacyWeight(category: string): number {
  const normalized = category.toLowerCase();
  if (normalized === "medical" || normalized === "finance") return 0.9;
  if (normalized === "email" || normalized === "classification") return 0.65;
  if (normalized === "research" || normalized === "travel" || normalized === "analytics") return 0.55;
  return 0.35;
}

function highestScore(scores: Record<ExecutionStrategy, number>): number {
  return Object.values(scores ?? {}).reduce((max, score) => Math.max(max, score), 0);
}

function scoreDeltaText(selected: number, alternative: number): string {
  const delta = selected - alternative;
  if (delta <= 0) return "tie";
  return `-${delta.toFixed(3)}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
