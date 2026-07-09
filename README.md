# Adaptive AI Orchestrator (AIO)

Adaptive AI Orchestrator is an enterprise routing platform that selects the **cheapest acceptable execution strategy** for each request instead of defaulting to expensive agent workflows.

## Hackathon Narrative

### Problem
Most enterprise AI platforms route too many tasks to large models or agents.  
That creates unnecessary cost, latency, and operational risk.

### Current Industry Approach
- One-size-fits-all model selection
- Agent-first execution even for simple tasks
- Limited traceability for why a route was selected

### Adaptive AI Orchestrator Approach
- Evaluate each request by complexity, reasoning depth, context size, privacy, cost, and latency
- Score all strategies
- Select the lowest-cost strategy that still meets confidence and quality constraints

### Benefits
- Lower operating cost
- Faster response time
- Better explainability and governance
- Clear demo evidence vs always-agent baselines

See `docs/BUSINESS_IMPACT_EVIDENCE.md` for reviewer-facing ROI evidence,
live API snapshots, trial methodology, and prototype claim boundaries.

## Submission Assets

Reviewer-ready materials are included with the project:

- `outputs/demo-video/adaptive-ai-orchestrator-project-overview.mp4` - under-5-minute project overview video for SharePoint upload
- `outputs/demo-video/adaptive-ai-orchestrator-project-overview.pptx` - editable source deck for the overview video
- `outputs/demo-video/adaptive-ai-orchestrator-cover-page.png` - hackathon submission cover image
- `outputs/demo-video/adaptive-ai-orchestrator-logo-100.png` - 100x100 project logo for submission portals
- `docs/BUSINESS_IMPACT_EVIDENCE.md` - ROI evidence, trial data, and prototype claim boundaries

## Execution Strategies

- `DETERMINISTIC_CODE`
- `AI_SKILL`
- `SMALL_LLM`
- `MEDIUM_LLM`
- `LARGE_LLM`
- `SINGLE_AGENT`
- `MULTI_AGENT_WORKFLOW`

## Architecture

### End-to-End Flow

```mermaid
flowchart TD
    A["User Prompt"] --> B["Decision Engine"]
    B --> C{"Select Cheapest Acceptable Strategy"}
    C --> C1["CODE"]
    C --> C2["SKILL"]
    C --> C3["SMALL/MEDIUM/LARGE LLM"]
    C --> C4["AGENT/MULTI_AGENT"]
    C1 --> D["Execution"]
    C2 --> D
    C3 --> D
    C4 --> D
    D --> E["Cost Intelligence"]
    E --> F["Learning Engine"]
    F --> G["Analytics + Observability"]
    G --> H["Executive Dashboard"]
```

### Component Diagram

```mermaid
flowchart LR
    UI["React UI: Landing, Executive, Live Orchestrator"] --> API["REST Controllers"]
    API --> SERVICE["OrchestrationService"]
    SERVICE --> ORCH["AdaptiveOrchestrator"]
    ORCH --> DEC["DecisionEngine + StrategySelector"]
    DEC --> COST["CostEstimator + CostPolicy"]
    ORCH --> PATHS{"ExecutionPathRegistry"}
    PATHS --> CODE["DeterministicCodeExecutionPath"]
    PATHS --> SKILL["SkillExecutionPath"]
    PATHS --> LLM["Small/Medium/Large LLM Paths"]
    PATHS --> AGENT["Single + Multi Agent Paths"]
    SERVICE --> LEARN["LearningEngine"]
    SERVICE --> TRACE["ExecutionTraceService"]
    TRACE --> OBS["ObservabilityController"]
    API --> ANALYTICS["AnalyticsController"]
```

### Request Sequence

```mermaid
sequenceDiagram
    participant User
    participant Controller as OrchestrationController
    participant Service as DefaultOrchestrationService
    participant Orchestrator as DefaultAdaptiveOrchestrator
    participant Decision as DefaultDecisionEngine
    participant Path as ExecutionPath
    participant Learn as LearningEngine
    participant Trace as ExecutionTraceService

    User->>Controller: POST /api/v1/orchestrator/execute
    Controller->>Service: execute(request)
    Service->>Trace: start(requestId, correlationId)
    Service->>Orchestrator: decide(request)
    Orchestrator->>Decision: evaluate(request)
    Decision-->>Orchestrator: StrategyDecision
    Orchestrator-->>Service: StrategyDecision
    Service->>Orchestrator: execute(request, decision)
    Orchestrator->>Path: execute(request)
    Path-->>Orchestrator: OrchestrationResult
    Orchestrator-->>Service: OrchestrationResult
    Service->>Learn: learn(decision, result)
    Service->>Trace: markResult(result)
    Service-->>Controller: OrchestrationResult
    Controller-->>User: 200 OK
```

## Frontend Experience

### 1. Landing Page
Explains:
- Problem
- Current industry approach
- Adaptive orchestrator approach
- Benefits
- Cost and latency savings
- Architecture
- Demo flow
- Technology stack

### 2. Executive Dashboard
Shows:
- KPI cards (cost, latency, success, savings)
- Route distribution
- Efficiency indicators
- Timeline snapshot
- Scenario benchmark highlights

### 3. Live Orchestrator Dashboard
Includes:
- Prompt execution
- Live execution visualization
- Explainable AI panel
- Cost intelligence dashboard
- Demo center with one-click scenarios
- Timeline, learning trends, benchmark table

## API Documentation

Base URL: `http://localhost:8080/api/v1/orchestrator`

### Execute Request
- `POST /execute`

Example body:

```json
{
  "tenantId": "enterprise-tenant",
  "userId": "architect-user",
  "payload": "Draft an executive email summary",
  "metadata": {
    "category": "email",
    "difficulty": "easy"
  }
}
```

Note: Current hackathon build accepts `tenantId` and `userId` in request body for demo simplicity.  
Production roadmap moves identity to JWT/SecurityContext with tenant isolation controls.

### Analytics APIs
- `GET /analytics/summary`
- `GET /analytics/paths`
- `GET /analytics/history?limit=50`
- `GET /analytics/learning?limit=50`
- `GET /analytics/scenarios`

### Observability APIs
- `GET /observability/traces?limit=20`
- `GET /observability/traces/{requestId}`
- `GET /observability/metrics`
- `GET /actuator/health`

## Demo Center Scenarios

One-click demo scenarios:
1. Validate JSON
2. Generate SQL
3. Translate Text
4. Summarize Report
5. Draft Email
6. Travel Planner
7. Enterprise Architecture Review
8. Research Topic
9. Medical Summary
10. Financial Analysis

Demo Center supports:
- single scenario execution
- run-all automation
- live routing status
- execution metrics
- cost and latency savings tracking
- presentation mode for finale demos

## Hackathon Finale Demo Script

1. Open **Landing** and narrate the problem and why always-agent is inefficient.  
2. Switch to **Executive Dashboard** and show live savings and route distribution.  
3. Open **Live Orchestrator** and run 2 to 3 single scenarios.  
4. Run **Run All Scenarios** in Demo Center.  
5. Highlight Explainable AI reasoning and rejected alternatives.  
6. Close with cost and latency savings evidence from cost intelligence cards.
7. For review evidence, open `docs/BUSINESS_IMPACT_EVIDENCE.md` and show the
   live API endpoints, trial results, and prototype claim boundaries.

## Project Structure

```text
adaptive-ai-orchestrator/
  backend/src/main/java/com/aio/orchestrator/
    controller/
    service/
    orchestrator/
    decision/
    cost/
    skills/
    llm/
    agents/
    repository/
    model/
    config/
    telemetry/
    analytics/
  frontend/src/
    app/
    features/orchestration/components/
    shared/contracts/
```

## Run Locally

### Fast Hackathon Demo

This repo includes Windows helper scripts for the portable toolchain under `D:\tools`.

```powershell
# from repository root
.\build-local.cmd
.\run-backend-local.cmd
.\run-frontend-local.cmd
```

Open:
- Frontend: `http://127.0.0.1:5173`
- Backend health: `http://localhost:8080/actuator/health`

Run the backend first, then the frontend. The frontend supports both `localhost:5173`
and `127.0.0.1:5173` during local demo.

### Backend

```powershell
cd backend
$env:JAVA_HOME="D:\tools\jdk-21"
$env:Path="$env:JAVA_HOME\bin;D:\tools\maven\bin;$env:Path"
mvn clean package
java -jar target\adaptive-ai-orchestrator-0.0.1-SNAPSHOT.jar `
  --spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration,org.springframework.boot.autoconfigure.jdbc.DataSourceTransactionManagerAutoConfiguration,org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration,org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration
```

### Frontend

```powershell
cd frontend
$env:Path="D:\tools\nodejs;$env:Path"
npm install
npm run build
npm run dev -- --host 127.0.0.1
```

## Verification Commands

```powershell
# backend
cd backend
$env:JAVA_HOME="D:\tools\jdk-21"
$env:Path="$env:JAVA_HOME\bin;D:\tools\maven\bin;$env:Path"
mvn clean install

# frontend
cd ../frontend
$env:Path="D:\tools\nodejs;$env:Path"
npm run build
```

## Notes

- Existing architecture and backend modules are preserved.
- Execution paths are replaceable via interfaces and registry.
- In-memory adapters are used for deterministic local demo behavior.
