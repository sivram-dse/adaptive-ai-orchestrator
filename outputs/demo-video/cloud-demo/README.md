# Cloud Demo Recording

## Deliverables

- `demo.mp4` - verified 4:12 narrated product demonstration (1920x1080 H.264/AAC)
- `demo.webm` - original Playwright browser recording
- `narration.md` - complete spoken narration
- `demo_steps.md` - time-ordered interaction plan and verified outcomes
- `screenshots/` - landing, dashboard, orchestration, error-handling, and analytics milestones
- `record-live-demo.mjs` - Playwright recording script
- `narration.wav` - generated female voice-over source

## How It Was Created

1. The Spring Boot backend was started locally with the `prod` profile.
2. The Vite frontend was started on `http://127.0.0.1:5173`.
3. Playwright Chromium verified each route and executed the core workflows.
4. Playwright recorded a 1920x1080 browser session with deliberate mouse movement, typing, scrolling, click pacing, and an in-page visible cursor.
5. Windows Speech Synthesis generated the narration using the installed Microsoft Zira female voice.
6. Playwright's FFmpeg binary combined the browser recording and narration into `demo.mp4`.

## Deployment Check

The supplied public URLs were checked before recording:

- `https://adaptive-ai-orchestrator.vercel.app` returned `DEPLOYMENT_NOT_FOUND`.
- `https://adaptive-ai-orchestrator.onrender.com/health` returned `404`.

The video therefore records the same production-profile application locally. The browser workflow, backend API, orchestration results, traces, and analytics are real application behavior, not simulated screenshots.

## Re-recording

With the backend and frontend running locally:

```powershell
node outputs/demo-video/cloud-demo/record-live-demo.mjs
```

Then combine the generated WebM and narration WAV using the FFmpeg command in the recording script output. The script requires Playwright with Chromium installed.
