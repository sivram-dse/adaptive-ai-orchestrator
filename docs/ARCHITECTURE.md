# AIO Architecture

## Core Principles

1. Route to the cheapest acceptable strategy, not the most powerful by default.
2. Keep all execution paths replaceable behind interfaces.
3. Isolate business logic from controllers.
4. Capture telemetry and learning feedback after every execution.

## Runtime Decision Flow

1. Validate and normalize request (`requestId`, `correlationId`, metadata defaults).
2. Classify complexity and compute weighted strategy scores.
3. Apply policy constraints (cost, confidence, latency, determinism/safety).
4. Select lowest-cost acceptable strategy.
5. Execute through `ExecutionPathRegistry` and path-specific adapter.
6. Persist decisions/results, publish structured telemetry, update learning snapshots.
7. Expose analytics and traces to dashboard.

## Key Replaceable Ports

- `service.OrchestrationService`
- `orchestrator.AdaptiveOrchestrator`
- `orchestrator.ExecutionPathRegistry`
- `decision.DecisionEngine`
- `cost.CostEstimator` / `cost.CostPolicy`
- `skills.SkillRegistry`
- `llm.LanguageModelGateway` tiers
- `agents.SingleAgentCoordinator` / `agents.MultiAgentCoordinator`
- `repository.DecisionRepository` / `repository.ExecutionRepository`
- `telemetry.TelemetryPublisher`
- `analytics.LearningEngine`

## Observability

- Correlation propagation: `X-Correlation-Id`
- Execution trace timeline: request -> decision -> completion/failure
- Metrics: avg cost, latency, confidence, success/failure, savings
- Health: custom `ExecutionTraceHealthIndicator`

## Diagrams

- UML: `docs/diagrams/uml-class-diagram.mmd`
- Components: `docs/diagrams/component-diagram.mmd`
