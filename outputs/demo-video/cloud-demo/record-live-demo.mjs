import { chromium } from "../../../frontend/node_modules/playwright/index.mjs";
import { access, mkdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const screenshotDir = path.join(currentDir, "screenshots");
const videoDir = path.join(currentDir, "playwright-video");
const outputVideo = path.join(currentDir, "demo.webm");
const baseUrl = process.env.DEMO_FRONTEND_URL ?? "http://127.0.0.1:5173";
const healthUrl = process.env.DEMO_BACKEND_HEALTH_URL ?? "http://127.0.0.1:8080/health";

const actions = [];

await assertAvailable(healthUrl, "backend health");
await assertAvailable(baseUrl, "frontend");
await mkdir(screenshotDir, { recursive: true });
await mkdir(videoDir, { recursive: true });
await assertDoesNotExist(outputVideo);

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 1,
  recordVideo: {
    dir: videoDir,
    size: { width: 1920, height: 1080 },
  },
});
const page = await context.newPage();
const video = page.video();

await page.addInitScript(() => {
  const addCursor = () => {
    if (document.getElementById("aio-demo-cursor")) return;
    const style = document.createElement("style");
    style.textContent = `
      #aio-demo-cursor { position: fixed; z-index: 2147483647; width: 22px; height: 22px;
        margin: -3px 0 0 -3px; pointer-events: none; opacity: 0; transition: left 120ms linear, top 120ms linear, opacity 120ms ease; }
      #aio-demo-cursor::before { content: ''; display: block; width: 0; height: 0;
        border-top: 10px solid #ffffff; border-right: 6px solid transparent; border-bottom: 8px solid transparent;
        filter: drop-shadow(0 1px 2px rgba(0,0,0,.9)); transform: rotate(-28deg); }
    `;
    document.head.appendChild(style);
    const cursor = document.createElement("div");
    cursor.id = "aio-demo-cursor";
    document.body.appendChild(cursor);
  };
  document.addEventListener("DOMContentLoaded", addCursor);
  addCursor();
});

async function pause(milliseconds) {
  await page.waitForTimeout(milliseconds);
}

async function visit(route, label) {
  await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
  actions.push({ at: new Date().toISOString(), action: `Opened ${label}`, route });
  await pause(1800);
}

async function showCursorAt(x, y) {
  await page.mouse.move(x, y, { steps: 10 });
  await page.evaluate(([left, top]) => {
    const cursor = document.getElementById("aio-demo-cursor");
    if (!cursor) return;
    cursor.style.left = `${left}px`;
    cursor.style.top = `${top}px`;
    cursor.style.opacity = "1";
  }, [x, y]);
}

async function click(locator, label) {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  if (box) {
    await showCursorAt(box.x + box.width / 2, box.y + box.height / 2);
    await pause(650);
  }
  await locator.click();
  actions.push({ at: new Date().toISOString(), action: `Clicked ${label}` });
  await pause(1300);
}

async function scrollBy(amount, label) {
  await showCursorAt(1760, 880);
  await page.mouse.wheel(0, amount);
  actions.push({ at: new Date().toISOString(), action: `Scrolled ${label}`, amount });
  await pause(2200);
}

async function capture(name) {
  await page.screenshot({ path: path.join(screenshotDir, name), type: "png" });
  actions.push({ at: new Date().toISOString(), action: `Captured ${name}` });
}

try {
  await visit("/", "Landing Page");
  await showCursorAt(430, 340);
  await pause(12000);
  await capture("01-landing.png");
  await scrollBy(650, "landing value proposition");
  await pause(9000);
  await scrollBy(740, "runtime architecture");
  await pause(9500);
  await capture("02-architecture.png");

  await click(page.getByRole("link", { name: "Executive", exact: true }), "Executive navigation");
  await pause(11000);
  await capture("03-executive-dashboard.png");
  await scrollBy(620, "executive route distribution");
  await pause(10000);
  await scrollBy(650, "executive execution timeline");
  await pause(9000);

  await click(page.getByRole("link", { name: "Orchestrator", exact: true }), "Orchestrator navigation");
  await pause(9000);
  await click(page.getByRole("button", { name: "Run Orchestration" }), "JSON validation orchestration");
  await page.getByRole("status").waitFor({ state: "visible", timeout: 15000 });
  await pause(10000);
  await page.getByText("Interactive Execution Visualization").scrollIntoViewIfNeeded();
  await pause(9500);
  await capture("04-deterministic-route.png");

  const draftEmail = page.getByRole("button", { name: "Run Draft Email" });
  await click(draftEmail, "Draft Email scenario");
  await pause(12000);
  await capture("05-skill-route.png");

  await page.locator('input[placeholder="Enter enterprise prompt"]').scrollIntoViewIfNeeded();
  const prompt = page.locator('input[placeholder="Enter enterprise prompt"]');
  await click(prompt, "enterprise migration prompt input");
  await page.keyboard.press("Control+A");
  await page.keyboard.type(
    "Review this enterprise platform architecture and propose a phased migration strategy with risks, controls, sequencing, and executive decisions.",
    { delay: 24 },
  );
  await page.locator("select").nth(0).selectOption("reasoning");
  await page.locator("select").nth(1).selectOption("complex");
  actions.push({ at: new Date().toISOString(), action: "Typed complex enterprise architecture request" });
  await pause(1800);
  await click(page.getByRole("button", { name: "Run Orchestration" }), "complex reasoning orchestration");
  await pause(13000);
  await page.getByText("Interactive Execution Visualization").scrollIntoViewIfNeeded();
  await pause(10000);
  await capture("06-large-llm-route.png");

  const translationScenario = page.getByRole("button", { name: "Run Translate Text" });
  await click(translationScenario, "Translate Text error-handling scenario");
  await page.getByRole("alert").waitFor({ state: "visible", timeout: 15000 });
  await pause(8500);
  await capture("07-structured-error.png");
  await click(page.getByRole("button", { name: "Run Draft Email" }), "recovery Draft Email scenario");
  await pause(9500);

  await page.getByText("Cost Intelligence Dashboard").scrollIntoViewIfNeeded();
  await pause(12000);
  await capture("08-cost-intelligence.png");
  await scrollBy(620, "execution comparison and route distribution");
  await pause(9500);
  await scrollBy(690, "execution timeline and benchmark dashboard");
  await pause(9500);
  await capture("09-execution-history.png");

  await click(page.getByRole("link", { name: "Executive", exact: true }), "Executive closing dashboard");
  await pause(14000);
  await capture("10-executive-close.png");
  await scrollBy(540, "executive close metrics");
  await pause(12000);
} finally {
  actions.push({ at: new Date().toISOString(), action: "Recording completed" });
  await writeFile(path.join(currentDir, "recording-actions.json"), JSON.stringify(actions, null, 2));
  await context.close();
  const recordedPath = await video.path();
  await rename(recordedPath, outputVideo);
  await browser.close();
}

console.log(`Browser recording written to ${outputVideo}`);
console.log("Combine demo.webm with narration.wav to create demo.mp4.");

async function assertAvailable(url, label) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
  } catch (error) {
    throw new Error(`Cannot start recording because ${label} is unavailable at ${url}: ${error.message}`);
  }
}

async function assertDoesNotExist(file) {
  try {
    await access(file);
    throw new Error(`Refusing to overwrite existing recording: ${file}`);
  } catch (error) {
    if (error.code === "ENOENT") return;
    throw error;
  }
}
