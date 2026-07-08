type LandingPageProps = {
  onOpenDemo: () => void;
  onOpenExecutive: () => void;
};

export function LandingPage({ onOpenDemo, onOpenExecutive }: LandingPageProps) {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 p-4 text-slate-100 md:p-6">
      <section className="mx-auto max-w-7xl space-y-4">
        <header className="overflow-hidden rounded-3xl border border-cyan-200/20 bg-slate-900/60 p-6 shadow-[0_25px_70px_rgba(2,12,27,0.45)] backdrop-blur">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/80">Hackathon Finale</p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-white md:text-5xl">
            Adaptive AI Orchestrator
          </h1>
          <p className="mt-3 max-w-3xl text-sm text-slate-200/90 md:text-base">
            Route each request to the cheapest execution path that still meets quality and latency goals.
            Stop defaulting to costly agents when CODE, SKILL, or a smaller model can do the job faster.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onOpenDemo}
              className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-cyan-300"
            >
              Launch Live Demo
            </button>
            <button
              type="button"
              onClick={onOpenExecutive}
              className="rounded-lg border border-cyan-200/30 bg-slate-900/50 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-slate-800"
            >
              Open Executive Dashboard
            </button>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-2">
          <InfoCard
            icon="problem"
            title="Problem"
            body="Enterprise teams overuse expensive agents for every request, causing avoidable token burn, latency spikes, and lower throughput."
          />
          <InfoCard
            icon="industry"
            title="Current Industry Approach"
            body="One-size-fits-all routing sends most tasks to large models or agents. This ignores request complexity and wastes budget."
          />
          <InfoCard
            icon="adaptive"
            title="Adaptive AI Orchestrator Approach"
            body="A decision engine scores every strategy and selects the lowest-cost path that satisfies confidence and latency constraints."
          />
          <InfoCard
            icon="benefits"
            title="Benefits"
            body="Lower cost, faster responses, better governance, and transparent explainability for every routing decision."
          />
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Cost Savings" value="40-90%" subtitle="vs always-agent execution" />
          <StatCard label="Latency Savings" value="25-80%" subtitle="task-type dependent" />
          <StatCard label="Routing Options" value="7 Paths" subtitle="Code, Skill, LLM tiers, Agent tiers" />
          <StatCard label="Observability" value="End-to-End" subtitle="trace, metrics, analytics, learning" />
        </section>

        <section className="rounded-2xl border border-cyan-200/20 bg-slate-900/60 p-5">
          <h2 className="font-display text-xl font-semibold">Architecture</h2>
          <div className="mt-4 grid gap-2 md:grid-cols-7">
            <FlowNode label="User Prompt" />
            <FlowArrow />
            <FlowNode label="Decision Engine" />
            <FlowArrow />
            <FlowNode label="Execution Path" />
            <FlowArrow />
            <FlowNode label="Cost + Learning + Analytics" />
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-7">
            <PathNode label="CODE" />
            <PathNode label="SKILL" />
            <PathNode label="SMALL_LLM" />
            <PathNode label="MEDIUM_LLM" />
            <PathNode label="LARGE_LLM" />
            <PathNode label="AGENT" />
            <PathNode label="MULTI_AGENT" />
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border border-cyan-200/20 bg-slate-900/60 p-5">
            <h2 className="font-display text-xl font-semibold">Demo Flow</h2>
            <ol className="mt-3 space-y-2 text-sm text-slate-200/90">
              <li className="rounded-lg border border-slate-700 bg-slate-950/50 px-3 py-2">
                1. Run one-click scenarios from Demo Center.
              </li>
              <li className="rounded-lg border border-slate-700 bg-slate-950/50 px-3 py-2">
                2. Watch live routing and explainable reasoning.
              </li>
              <li className="rounded-lg border border-slate-700 bg-slate-950/50 px-3 py-2">
                3. Compare Adaptive vs Traditional vs Always Agent in cost and latency.
              </li>
              <li className="rounded-lg border border-slate-700 bg-slate-950/50 px-3 py-2">
                4. Present executive metrics and scenario benchmark savings.
              </li>
            </ol>
          </article>

          <article className="rounded-2xl border border-cyan-200/20 bg-slate-900/60 p-5">
            <h2 className="font-display text-xl font-semibold">Technology Stack</h2>
            <div className="mt-3 grid gap-2 text-sm text-slate-200/90">
              <TechItem label="Backend" value="Java 21, Spring Boot 3, Maven" />
              <TechItem label="Frontend" value="React, TailwindCSS" />
              <TechItem label="Data" value="PostgreSQL, Redis, Kafka (optional)" />
              <TechItem label="AI" value="OpenAI Responses API, Skills, Agent Runtime" />
              <TechItem label="Architecture" value="Clean Architecture, replaceable execution paths" />
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}

function InfoCard({ title, body, icon }: { title: string; body: string; icon: "problem" | "industry" | "adaptive" | "benefits" }) {
  return (
    <article className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4 transition hover:border-cyan-300/40 hover:bg-slate-900/80">
      <div className="flex items-center gap-2">
        <Icon kind={icon} />
        <h2 className="font-display text-lg font-semibold">{title}</h2>
      </div>
      <p className="mt-2 text-sm text-slate-200/90">{body}</p>
    </article>
  );
}

function StatCard({ label, value, subtitle }: { label: string; value: string; subtitle: string }) {
  return (
    <article className="rounded-2xl border border-cyan-200/20 bg-slate-900/60 p-4">
      <p className="text-xs uppercase tracking-wide text-cyan-100/70">{label}</p>
      <p className="mt-2 font-display text-2xl font-bold text-cyan-50">{value}</p>
      <p className="mt-1 text-xs text-slate-300">{subtitle}</p>
    </article>
  );
}

function TechItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-950/50 px-3 py-2">
      <p className="text-xs uppercase tracking-wide text-cyan-100/75">{label}</p>
      <p className="mt-1 text-sm">{value}</p>
    </div>
  );
}

function FlowNode({ label }: { label: string }) {
  return <div className="rounded-lg border border-slate-700 bg-slate-950/55 px-3 py-2 text-center text-xs font-semibold">{label}</div>;
}

function PathNode({ label }: { label: string }) {
  return <div className="rounded-lg border border-cyan-300/20 bg-cyan-500/10 px-2 py-2 text-center text-[11px] font-semibold text-cyan-100">{label}</div>;
}

function FlowArrow() {
  return (
    <div className="hidden items-center justify-center md:flex">
      <svg viewBox="0 0 24 24" className="h-4 w-4 text-cyan-300" fill="none" aria-hidden>
        <path d="M5 12h14m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function Icon({ kind }: { kind: "problem" | "industry" | "adaptive" | "benefits" }) {
  if (kind === "problem") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-rose-300" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.7" />
        <path d="M12 8v5m0 3h.01" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    );
  }
  if (kind === "industry") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-amber-300" fill="none" aria-hidden>
        <path d="M4 19V7l5 3V7l5 3V5l6 4v10H4Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      </svg>
    );
  }
  if (kind === "adaptive") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-cyan-300" fill="none" aria-hidden>
        <path d="M4 12h4m4 0h8m-8-6 4 6-4 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-emerald-300" fill="none" aria-hidden>
      <path d="m5 13 4 4L19 7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
