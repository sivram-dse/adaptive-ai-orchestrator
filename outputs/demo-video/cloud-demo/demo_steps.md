# Demonstration Steps

## Recording Environment

- Frontend: `http://127.0.0.1:5173/`
- Backend: `http://127.0.0.1:8080/`
- Browser: Playwright Chromium at 1920x1080
- Recording: Playwright video capture with a visible in-page cursor
- Backend profile: `prod`

## Flow

1. Open the landing page and pause on the product name and value proposition.
2. Scroll through the problem, adaptive approach, measured benchmark cards, and runtime architecture.
3. Open the Executive Dashboard.
4. Pause on the executive KPIs, route distribution, efficiency indicators, and execution timeline.
5. Open the Live Orchestrator.
6. Run the default JSON-validation request and show deterministic-code routing, confidence, latency, tokens, cost, rationale, and trace.
7. Scroll to Demo Center and run **Draft Email** to demonstrate the reusable AI-skill route.
8. Return to the input form, type an enterprise migration request, select `reasoning` and `complex`, and run orchestration.
9. Show the large-model escalation, decision visualization, explainability panel, and result metrics.
10. Run **Translate Text** to intentionally demonstrate the currently unregistered translation-skill failure.
11. Pause on the structured user-visible error and then recover by running **Draft Email** again.
12. Scroll through Cost Intelligence, the execution comparison matrix, route distribution, execution timeline, and benchmark dashboard.
13. Return to the Executive Dashboard for the closing summary.

## Verified Outcomes

| Workflow | Outcome |
|---|---|
| Landing route | Loaded successfully |
| Executive route | Loaded successfully |
| Orchestrator route | Loaded successfully |
| JSON validation | `DETERMINISTIC_CODE`, 99.0% confidence |
| Executive email | `AI_SKILL`, 91.0% confidence |
| Complex architecture request | `LARGE_LLM`, 93.0% confidence |
| Translate Text sample | Structured 500 response; missing translation skill documented below |

## Known Demo Limitation Shown in the Recording

The **Translate Text** sample is classified to `AI_SKILL`, but the current deterministic demo skill registry has no translation skill. The backend retries once, returns a structured error with a correlation ID, and the interface displays the failure. The recording immediately demonstrates recovery with a registered skill. This is documented rather than hidden because it is useful evidence of the prototype's traceability and error-handling behavior.
