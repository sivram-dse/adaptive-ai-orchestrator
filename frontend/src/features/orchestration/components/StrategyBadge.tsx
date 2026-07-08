import { StrategyBadgeProps } from "../types/StrategyBadgeProps";

const colorByStrategy: Record<StrategyBadgeProps["strategy"], string> = {
  DETERMINISTIC_CODE: "bg-emerald-100 text-emerald-800 border-emerald-300",
  AI_SKILL: "bg-cyan-100 text-cyan-800 border-cyan-300",
  SMALL_LLM: "bg-indigo-100 text-indigo-800 border-indigo-300",
  MEDIUM_LLM: "bg-blue-100 text-blue-800 border-blue-300",
  LARGE_LLM: "bg-sky-100 text-sky-800 border-sky-300",
  SINGLE_AGENT: "bg-amber-100 text-amber-900 border-amber-300",
  MULTI_AGENT_WORKFLOW: "bg-rose-100 text-rose-900 border-rose-300",
};

export function StrategyBadge(props: StrategyBadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold ${colorByStrategy[props.strategy]}`}>
      {props.strategy.replaceAll("_", " ")}
    </span>
  );
}
