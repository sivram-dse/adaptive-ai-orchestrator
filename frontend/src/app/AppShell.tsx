import { useEffect, useMemo, useState } from "react";
import { Activity, BarChart3, Github, Home, Network, RefreshCw } from "lucide-react";
import { Navigate, NavLink, Route, Routes, useNavigate } from "react-router-dom";
import { ExecutiveDashboard } from "../features/orchestration/components/ExecutiveDashboard";
import { LandingPage } from "../features/orchestration/components/LandingPage";
import { OrchestrationPage } from "../features/orchestration/components/OrchestrationPage";
import { HttpOrchestrationApi } from "../features/orchestration/api/HttpOrchestrationApi";

type BackendStatus = "checking" | "online" | "offline";

const repositoryUrl = "https://github.com/sivram-dse/adaptive-ai-orchestrator";

export function AppShell() {
  const navigate = useNavigate();
  const api = useMemo(() => new HttpOrchestrationApi(), []);
  const [backendStatus, setBackendStatus] = useState<BackendStatus>("checking");

  async function checkBackend() {
    setBackendStatus("checking");
    try {
      const health = await api.getHealth();
      setBackendStatus(health.status === "UP" ? "online" : "offline");
    } catch {
      setBackendStatus("offline");
    }
  }

  useEffect(() => {
    void checkBackend();
    const timer = window.setInterval(() => void checkBackend(), 60_000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <nav className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center gap-3 px-4 md:px-6">
          <NavLink to="/" className="mr-auto flex min-w-0 items-center gap-2.5" aria-label="Adaptive AI Orchestrator home">
            <img src="/aio-logo.png" alt="" className="h-9 w-9 shrink-0" />
            <div className="hidden min-w-0 sm:block">
              <p className="truncate font-display text-sm font-semibold text-white">Adaptive AI Orchestrator</p>
              <p className="text-[10px] uppercase text-cyan-300">Enterprise AI control plane</p>
            </div>
          </NavLink>

          <div className="flex items-center rounded-md border border-slate-700 bg-slate-900 p-1">
            <NavigationItem to="/" label="Overview" icon={<Home size={15} />} />
            <NavigationItem to="/executive" label="Executive" icon={<BarChart3 size={15} />} />
            <NavigationItem to="/orchestrator" label="Orchestrator" icon={<Network size={15} />} />
          </div>

          <div className="hidden items-center gap-2 lg:flex">
            <BackendIndicator status={backendStatus} onRetry={() => void checkBackend()} />
            <a
              href={repositoryUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-700 text-slate-300 transition hover:border-cyan-400/60 hover:text-cyan-200"
              title="Open GitHub repository"
              aria-label="Open GitHub repository"
            >
              <Github size={17} />
            </a>
          </div>
        </div>
      </nav>

      {backendStatus !== "online" && (
        <div className={`border-b px-4 py-2 text-center text-xs ${backendStatus === "checking" ? "border-amber-400/20 bg-amber-400/10 text-amber-100" : "border-rose-400/20 bg-rose-400/10 text-rose-100"}`}>
          {backendStatus === "checking"
            ? "Connecting to the orchestration service. A sleeping Render free instance can take about one minute to wake."
            : "The orchestration service is not reachable yet. The overview remains available while the backend starts."}
          <button type="button" onClick={() => void checkBackend()} className="ml-2 inline-flex items-center gap-1 font-semibold text-white underline underline-offset-2">
            <RefreshCw size={12} className={backendStatus === "checking" ? "animate-spin" : ""} />
            Retry
          </button>
        </div>
      )}

      <div className="flex-1">
        <Routes>
          <Route path="/" element={<LandingPage onOpenDemo={() => navigate("/orchestrator")} onOpenExecutive={() => navigate("/executive")} />} />
          <Route path="/executive" element={<ExecutiveDashboard />} />
          <Route path="/orchestrator" element={<OrchestrationPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      <footer className="border-t border-slate-800 bg-slate-950 px-4 py-5 text-xs text-slate-400">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <p>Adaptive AI Orchestrator · Cost-aware routing with explainable execution.</p>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5"><Activity size={13} className="text-emerald-300" /> Hackathon prototype</span>
            <a href={repositoryUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-cyan-200 hover:text-cyan-100">
              <Github size={13} /> Source
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function NavigationItem({ to, label, icon }: { to: string; label: string; icon: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) => `inline-flex h-9 items-center gap-1.5 rounded px-2.5 text-xs font-semibold transition ${isActive ? "bg-cyan-400/15 text-cyan-100" : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"}`}
    >
      {icon}
      <span className="hidden md:inline">{label}</span>
    </NavLink>
  );
}

function BackendIndicator({ status, onRetry }: { status: BackendStatus; onRetry: () => void }) {
  const tone = status === "online" ? "bg-emerald-300" : status === "checking" ? "bg-amber-300 animate-pulse" : "bg-rose-300";
  const label = status === "online" ? "Backend online" : status === "checking" ? "Connecting" : "Backend offline";
  return (
    <button type="button" onClick={onRetry} className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-700 bg-slate-900 px-3 text-[11px] font-medium text-slate-300" title="Check backend health">
      <span className={`h-2 w-2 rounded-full ${tone}`} />
      {label}
    </button>
  );
}
