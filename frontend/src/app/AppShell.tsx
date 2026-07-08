import { useMemo, useState } from "react";
import { OrchestrationPage } from "../features/orchestration/components/OrchestrationPage";
import { LandingPage } from "../features/orchestration/components/LandingPage";
import { ExecutiveDashboard } from "../features/orchestration/components/ExecutiveDashboard";

type AppView = "landing" | "executive" | "orchestrator";

export function AppShell() {
  const [view, setView] = useState<AppView>("landing");

  const title = useMemo(() => {
    if (view === "landing") return "Landing";
    if (view === "executive") return "Executive Dashboard";
    return "Live Orchestrator";
  }, [view]);

  return (
    <div className="relative">
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-cyan-200/15 bg-slate-950/75 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-cyan-400/20 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-cyan-100">
              AIO
            </span>
            <p className="text-xs text-slate-200/90">{title}</p>
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900/70 p-1">
            <NavButton label="Landing" active={view === "landing"} onClick={() => setView("landing")} />
            <NavButton label="Executive" active={view === "executive"} onClick={() => setView("executive")} />
            <NavButton label="Orchestrator" active={view === "orchestrator"} onClick={() => setView("orchestrator")} />
          </div>
        </div>
      </nav>

      <div className="pt-14">
        {view === "landing" && (
          <LandingPage onOpenDemo={() => setView("orchestrator")} onOpenExecutive={() => setView("executive")} />
        )}
        {view === "executive" && <ExecutiveDashboard />}
        {view === "orchestrator" && <OrchestrationPage />}
      </div>
    </div>
  );
}

function NavButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
        active ? "bg-cyan-400/20 text-cyan-100" : "text-slate-300 hover:bg-slate-800"
      }`}
    >
      {label}
    </button>
  );
}
