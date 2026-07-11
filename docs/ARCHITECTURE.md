# Adaptive AI Orchestrator Architecture

## Runtime Architecture

```mermaid
flowchart TD
    USER["User or enterprise application"] --> UI["React / Vite experience"]
    UI --> API["Spring Boot REST API"]
    API --> SERVICE["Orchestration service"]
    SERVICE --> ENGINE["Adaptive decision engine"]

    ENGINE --> CLASSIFIER["Complexity classifier"]
    ENGINE --> SELECTOR["Strategy selector"]
    ENGINE --> POLICY["Cost and quality policy"]
    ENGINE --> ESTIMATOR["Cost, latency, and confidence estimator"]

    ENGINE --> REGISTRY{"Execution path registry"}
    REGISTRY --> RULES["Deterministic business rules"]
    REGISTRY --> SKILLS["Reusable AI skills"]
    REGISTRY --> SMALL["Small LLM"]
    REGISTRY --> MEDIUM["Medium LLM"]
    REGISTRY --> LARGE["Large LLM"]
    REGISTRY --> AGENT["Single agent"]
    REGISTRY --> MULTI["Multi-agent workflow"]

    RULES --> RESULT["Orchestration result"]
    SKILLS --> RESULT
    SMALL --> RESULT
    MEDIUM --> RESULT
    LARGE --> RESULT
    AGENT --> RESULT
    MULTI --> RESULT

    RESULT --> TRACE["Execution trace and structured telemetry"]
    RESULT --> ANALYTICS["Cost, latency, confidence, and savings analytics"]
    RESULT --> LEARNING["Learning snapshots"]
    RESULT --> UI
```

The decision engine evaluates every candidate strategy and selects the lowest estimated cost among the routes that satisfy configured quality, confidence, latency, and policy constraints. It does not default to the cheapest route when that route is unsuitable.

## Request Lifecycle

```mermaid
sequenceDiagram
    participant U as User
    participant F as React frontend
    participant A as REST API
    participant O as Orchestration service
    participant D as Decision engine
    participant E as Execution path
    participant T as Trace and analytics

    U->>F: Submit prompt
    F->>A: POST /api/v1/orchestrator/execute
    A->>O: Validated UserRequest
    O->>T: Start trace
    O->>D: Evaluate request and policies
    D-->>O: Selected strategy and rationale
    O->>T: Record decision
    O->>E: Execute selected path
    E-->>O: Output, cost, latency, tokens, confidence
    O->>T: Store result and learning snapshot
    O-->>A: OrchestrationResult
    A-->>F: JSON response with correlation ID
    F-->>U: Result, decision flow, trace, and analytics
```

## Cloud Deployment

```mermaid
flowchart LR
    DEV["GitHub repository"] --> CI["GitHub Actions"]
    CI -->|"backend checks pass"| RENDER["Render free web service"]
    CI -->|"frontend checks pass"| VERCEL["Vercel static deployment"]

    BROWSER["Judge's browser"] -->|"HTTPS"| VERCEL
    VERCEL -->|"REST over HTTPS"| RENDER
    RENDER --> CONTAINER["Java 21 Spring Boot container"]
    CONTAINER --> MEMORY["In-memory demo repositories"]

    RENDER --> HEALTH["/health and /actuator/health"]
```

The free deployment intentionally preserves the prototype's in-memory stores. Execution history resets whenever the Render service restarts, redeploys, or wakes on a fresh instance. PostgreSQL, Redis, and Kafka remain future production adapters rather than hidden runtime dependencies.

## Architectural Boundaries

- Controllers validate and expose the existing REST contracts.
- The orchestration service owns request normalization, trace lifecycle, result recording, and learning updates.
- The decision package owns classification, scoring, policy gates, and route selection.
- Execution paths isolate deterministic rules, skills, model gateways, and agent coordinators.
- In-memory repositories support a self-contained hackathon demo without credentials or paid infrastructure.
- Telemetry and analytics expose explainable routing, health, cost, latency, confidence, tokens, and savings.
