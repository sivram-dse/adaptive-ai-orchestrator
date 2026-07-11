# Free Cloud Deployment Guide

This guide deploys the Adaptive AI Orchestrator as a public hackathon prototype using:

- Render Free web service for the Spring Boot backend
- Vercel Hobby for the React/Vite frontend
- GitHub for source control and continuous integration

No database, paid add-on, API key, or external model credential is required for the deterministic demo build.

## Target URLs

The requested names produce these URLs when they are available in the selected accounts:

- Backend: `https://adaptive-ai-orchestrator.onrender.com`
- Frontend: `https://adaptive-ai-orchestrator.vercel.app`

Platform project names are globally shared. If either name is unavailable, use the URL assigned by the platform and update `VITE_API_BASE_URL` in Vercel.

## Prerequisites

1. A GitHub account with access to `sivram-dse/adaptive-ai-orchestrator`.
2. A free Render account connected to GitHub.
3. A free Vercel account connected to GitHub.
4. The deployment branch set to `codex/aio-integration-final`, or the branch merged into the repository's default branch.

## 1. Verify GitHub Actions

Push the deployment files to GitHub and open the repository's **Actions** tab. The **Build and Test** workflow must pass both jobs:

- Backend - Java 21: Maven tests and package verification
- Frontend - Node 22: locked install, security audit, and production build

Render is configured with `autoDeployTrigger: checksPass`, so an automatic backend deployment waits for successful repository checks.

## 2. Deploy the Backend to Render

The repository includes `render.yaml` and `backend/Dockerfile`. Java is deployed with Docker because Render does not provide a native JVM runtime.

1. Sign in at [Render Dashboard](https://dashboard.render.com/).
2. Select **New** and then **Blueprint**.
3. Connect the GitHub repository `sivram-dse/adaptive-ai-orchestrator`.
4. Select branch `codex/aio-integration-final` if prompted.
5. Render detects `render.yaml` at the repository root.
6. Confirm the service name `adaptive-ai-orchestrator`, region `Singapore`, runtime `Docker`, and plan `Free`.
7. Apply the Blueprint and wait for the Docker build, tests, health check, and deployment to complete.

The Blueprint sets:

| Setting | Value |
|---|---|
| Runtime | Docker with Java 21 |
| Plan | Free |
| Health check | `/health` |
| Spring profile | `prod` |
| CORS | Target Vercel URL and `*.vercel.app` previews |
| Auto deploy | After repository checks pass |

Verify the deployed backend:

```text
https://adaptive-ai-orchestrator.onrender.com/health
https://adaptive-ai-orchestrator.onrender.com/actuator/health
https://adaptive-ai-orchestrator.onrender.com/api/v1/orchestrator/analytics/summary
```

Both health endpoints should return HTTP 200 with status `UP`.

## 3. Deploy the Frontend to Vercel

1. Sign in at [Vercel Dashboard](https://vercel.com/dashboard).
2. Select **Add New** and then **Project**.
3. Import `sivram-dse/adaptive-ai-orchestrator`.
4. Set the production branch to `codex/aio-integration-final` if the work is not yet on the default branch.
5. Set **Root Directory** to `frontend`.
6. Keep framework preset **Vite**.
7. Confirm build command `npm run build` and output directory `dist`.
8. Add this environment variable for Production and Preview:

```text
VITE_API_BASE_URL=https://adaptive-ai-orchestrator.onrender.com
```

9. Select **Deploy**.

The committed `frontend/vercel.json` provides SPA deep-link rewrites and browser security headers. After deployment, verify all routes directly:

```text
https://adaptive-ai-orchestrator.vercel.app/
https://adaptive-ai-orchestrator.vercel.app/executive
https://adaptive-ai-orchestrator.vercel.app/orchestrator
```

## 4. End-to-End Verification

1. Open the frontend in a private browser window.
2. Confirm the navigation indicator changes to **Backend online**.
3. Open **Orchestrator**.
4. Run **Validate JSON**.
5. Confirm a success toast and a deterministic-code route.
6. Run one skill or LLM scenario and confirm the decision path changes.
7. Open **Executive** and verify request, cost, latency, confidence, and savings metrics.
8. Refresh `/executive` directly to confirm the Vercel rewrite works.
9. Open browser developer tools and confirm API calls use HTTPS and contain no CORS errors.

## Environment Variables

### Render Backend

| Variable | Required | Purpose |
|---|---:|---|
| `SPRING_PROFILES_ACTIVE=prod` | Yes | Enables the in-memory production demo profile and cloud tuning |
| `AIO_CORS_ALLOWED_ORIGIN_PATTERNS` | Yes | Comma-separated trusted frontend origins |
| `PORT` | Automatic | Render supplies the public service port |
| `AIO_MAX_ACCEPTABLE_COST_USD` | No | Overrides the maximum acceptable estimated cost |
| `AIO_MIN_CONFIDENCE_THRESHOLD` | No | Overrides the minimum confidence gate |
| `AIO_MAX_ACCEPTABLE_LATENCY_MS` | No | Overrides the latency gate |
| `AIO_MAX_RETRIES` | No | Overrides execution retry count |
| `LOG_LEVEL_ROOT` | No | Defaults to `INFO` |
| `LOG_LEVEL_AIO` | No | Defaults to `INFO` |

### Vercel Frontend

| Variable | Required | Purpose |
|---|---:|---|
| `VITE_API_BASE_URL` | Yes | Public Render origin without `/api/v1/orchestrator` |

Use `.env.example` and `frontend/.env.example` as templates. Never commit real secret values in `.env` files.

## Free-Tier Behavior

Render Free services sleep after 15 minutes without inbound traffic. The first request after sleep can take about one minute while the container starts. The frontend displays a connecting message and allows a health retry during this period.

The Render filesystem is ephemeral and the prototype repositories are intentionally in memory. Execution history and learning snapshots reset after a restart, redeploy, or new instance. This does not alter routing logic; it only affects retained demo history.

Render provides 750 free instance hours per workspace each month. Vercel Hobby is free but is intended for personal and non-commercial use. Confirm that the hackathon deployment and account ownership comply with your organization's policies and the current platform terms.

Official references:

- [Render Free service behavior](https://render.com/docs/free)
- [Render Docker deployment](https://render.com/docs/docker)
- [Render Blueprint specification](https://render.com/docs/blueprint-spec)
- [Vercel Vite deployment](https://vercel.com/docs/frameworks/frontend/vite)
- [Vercel Hobby plan](https://vercel.com/docs/plans/hobby)

## Troubleshooting

### Frontend Shows Backend Offline

- Open the Render `/health` URL and wait for status `UP`.
- Confirm `VITE_API_BASE_URL` contains only the Render origin.
- Redeploy Vercel after changing an environment variable because Vite embeds values during the build.

### Browser Reports a CORS Error

- Confirm the frontend uses a `vercel.app` hostname.
- For a custom domain, add it to Render's `AIO_CORS_ALLOWED_ORIGIN_PATTERNS` and redeploy the backend.
- Do not include path segments in an allowed origin.

### Render Build Cannot Find Java

- Confirm the service runtime is **Docker**.
- Confirm Dockerfile path is `backend/Dockerfile` and Docker context is `backend`.

### Vercel Route Returns 404 After Refresh

- Confirm project root is `frontend`.
- Confirm `frontend/vercel.json` is present in the deployed commit.

### Metrics Reset

- This is expected after a free-service restart because the current prototype uses in-memory repositories.
- Run **Run All Scenarios** to repopulate the dashboard for a judging session.

## Cost Guardrail

The configuration uses only free plans and no paid data services. Do not enable a paid Render instance, Vercel Pro trial, persistent disk, managed database, or other paid add-on unless separately approved.
