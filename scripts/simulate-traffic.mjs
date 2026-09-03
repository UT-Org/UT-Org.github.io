#!/usr/bin/env node

/**
 * Drives the real website in isolated browser sessions to generate a useful,
 * clearly labeled synthetic PostHog dataset.
 *
 * Example:
 *   npm run simulate:traffic -- --url https://example.github.io --visitors 25
 */
import { chromium } from "playwright";
import crypto from "node:crypto";

const SCENARIOS = [
  "bounce",
  "tutor_view",
  "tutor_view",
  "availability_abandon",
  "availability_abandon",
  "details_abandon",
  "completed_booking",
  "completed_booking",
];

const SOURCES = ["direct", "google", "facebook", "newsletter"];
const VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
];

function normalizeTargetUrl(value) {
  const markdownLink = value.match(/^\[(https?:\/\/[^\]]+)\]\((https?:\/\/[^)]+)\)$/);
  if (markdownLink) {
    value = markdownLink[2];
    console.warn("Markdown link syntax detected; using URL: " + value);
  }

  const url = new URL(value);
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("--url must use http:// or https://");
  }
  return url.toString();
}

function readArguments(argv) {
  const options = {
    url: "http://127.0.0.1:8080",
    visitors: 20,
    headed: false,
    delay: 250,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--headed") options.headed = true;
    else if (argument === "--url") options.url = normalizeTargetUrl(argv[++index]);
    else if (argument === "--visitors") options.visitors = Number(argv[++index]);
    else if (argument === "--delay") options.delay = Number(argv[++index]);
    else if (argument === "--help") options.help = true;
    else throw new Error("Unknown argument: " + argument);
  }

  if (!Number.isInteger(options.visitors) || options.visitors < 1) {
    throw new Error("--visitors must be a positive integer");
  }
  if (!Number.isFinite(options.delay) || options.delay < 0) {
    throw new Error("--delay must be zero or greater");
  }
  return options;
}

function printHelp() {
  console.log([
    "",
    "ABC Tutoring synthetic traffic simulator",
    "",
    "Options:",
    "  --url <url>          Site to exercise (default: http://127.0.0.1:8080)",
    "  --visitors <count>   Isolated visitor sessions (default: 20)",
    "  --delay <ms>         Pause between interactions (default: 250)",
    "  --headed             Show the browser while the script runs",
    "  --help               Show this message",
    "",
    "All resulting analytics events include:",
    "  synthetic_traffic = true",
    "  simulation_run_id = <unique run ID>",
    "",
  ].join("\n"));
}

function pick(items, visitorIndex) {
  return items[visitorIndex % items.length];
}

function buildVisitUrl(baseUrl, runId, visitorIndex) {
  const url = new URL(baseUrl);
  const source = pick(SOURCES, visitorIndex);
  url.searchParams.set("simulation", "true");
  url.searchParams.set("simulation_run_id", runId);
  url.searchParams.set("simulation_visitor", String(visitorIndex + 1));

  if (source !== "direct") {
    url.searchParams.set("utm_source", source);
    url.searchParams.set("utm_medium", source === "newsletter" ? "email" : "demo");
    url.searchParams.set("utm_campaign", "customer_demo");
  }
  return url.toString();
}

async function pause(page, milliseconds) {
  if (milliseconds > 0) await page.waitForTimeout(milliseconds);
}

async function chooseSubject(page, visitorIndex, delay) {
  const cards = page.locator("[data-subject]");
  await cards.nth(visitorIndex % (await cards.count())).click();
  await pause(page, delay);
}

async function chooseTutorAction(page, action, visitorIndex, delay) {
  const buttons = page.locator('[data-action="' + action + '"]');
  await buttons.nth(visitorIndex % (await buttons.count())).click();
  await pause(page, delay);
}

async function chooseSchedule(page, visitorIndex, delay) {
  const dates = page.locator("[data-date-index]");
  const times = page.locator("[data-time-index]");
  await dates.nth(visitorIndex % (await dates.count())).click();
  await times.nth(visitorIndex % (await times.count())).click();
  await pause(page, delay);
}

async function exerciseScenario(page, scenario, visitorIndex, delay) {
  if (scenario === "bounce") return;

  await chooseSubject(page, visitorIndex, delay);
  if (scenario === "tutor_view") {
    await chooseTutorAction(page, "profile", visitorIndex, delay);
    return;
  }

  await chooseTutorAction(page, "book", visitorIndex, delay);
  await chooseSchedule(page, visitorIndex, delay);
  if (scenario === "availability_abandon") {
    await page.locator("#closeBooking").click();
    return;
  }

  await page.locator("#continueBooking").click();
  await pause(page, delay);
  if (scenario === "details_abandon") {
    await page.locator("#closeBooking").click();
    return;
  }

  await page.locator("#parentName").fill("Synthetic Parent");
  await page.locator("#email").fill("synthetic+" + (visitorIndex + 1) + "@example.test");
  await page.locator("#student").fill("Test Student");
  await page.locator("#grade").selectOption({ index: (visitorIndex % 4) + 1 });
  await page.locator("#sessionFormat").selectOption(
    visitorIndex % 2 === 0 ? "Online" : "In person",
  );
  await page.locator("#bookingForm button[type='submit']").click();
  await page.locator("#bookingSuccess").waitFor({ state: "visible" });
  await pause(page, delay);
}

async function simulateVisitor(browser, options, runId, visitorIndex) {
  const scenario = pick(SCENARIOS, visitorIndex);
  const context = await browser.newContext({
    viewport: pick(VIEWPORTS, visitorIndex),
    locale: "en-US",
  });
  const page = await context.newPage();
  let telemetryRequests = 0;
  const telemetryStatuses = [];
  const posthogFailures = [];
  const pageErrors = [];

  page.on("request", (request) => {
    if (request.method() === "POST" && request.url().includes("posthog.com")) {
      telemetryRequests += 1;
    }
  });
  page.on("response", (response) => {
    if (
      response.request().method() === "POST" &&
      response.url().includes("posthog.com")
    ) {
      telemetryStatuses.push(response.status());
    }
  });
  page.on("requestfailed", (request) => {
    if (request.url().includes("posthog.com")) {
      posthogFailures.push(
        request.url() + ": " + (request.failure()?.errorText || "request failed"),
      );
    }
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  try {
    const response = await page.goto(buildVisitUrl(options.url, runId, visitorIndex), {
      waitUntil: "domcontentloaded",
    });
    if (!response?.ok()) {
      throw new Error("Website returned HTTP " + (response?.status() ?? "unknown"));
    }
    const pageTitle = await page.title();
    if (!pageTitle.includes("ABC Tutoring")) {
      throw new Error(
        'Expected "ABC Tutoring" in the page title, but received "' +
          (pageTitle || "(no title)") +
          '". The deployed site may be older than your local files.',
      );
    }

    try {
      await page.waitForFunction(
        () =>
          window.__ABC_POSTHOG_READY__ === true ||
          Boolean(window.posthog?.config?.token),
        undefined,
        { timeout: 30_000 },
      );
    } catch {
      const detail = posthogFailures.length
        ? posthogFailures.join("; ")
        : "No failed PostHog request was reported by the browser";
      throw new Error(
        "PostHog SDK did not finish loading. Check DNS, firewall, privacy " +
          "extensions, or ad-blocking settings. " + detail,
      );
    }

    // Make the simulator independent of the deployed site's normal batching
    // policy. This affects only this isolated synthetic browser context.
    await page.evaluate(() => {
      window.posthog.set_config({ request_batching: false });
      window.posthog.capture("simulation_session_started", {
        synthetic_traffic: true,
      });
    });

    await exerciseScenario(page, scenario, visitorIndex, options.delay);
    await page.waitForTimeout(1_500);
    if (pageErrors.length > 0) {
      throw new Error("Browser error: " + pageErrors.join("; "));
    }
  } finally {
    // PostHog can flush its event queue while the page is closing. Measure
    // telemetry only after closing this isolated visitor context.
    await context.close();
  }

  if (telemetryRequests === 0) {
    throw new Error(
      "No PostHog telemetry POST was observed, including during page close. " +
        "Check the project's ingestion settings and browser network policy.",
    );
  }
  if (telemetryStatuses.some((status) => status >= 400)) {
    throw new Error(
      "PostHog rejected telemetry with HTTP status " +
        telemetryStatuses.join(", "),
    );
  }
  return { scenario, telemetryRequests };
}

async function main() {
  const options = readArguments(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const runId = "sim_" + timestamp + "_" + crypto.randomBytes(3).toString("hex");
  const browser = await chromium.launch({
    headless: !options.headed,
    slowMo: options.headed ? Math.max(options.delay, 100) : 0,
  });
  const totals = new Map();
  let telemetryRequests = 0;

  console.log("Run ID: " + runId);
  console.log("Target: " + options.url);
  console.log("Visitors: " + options.visitors + "\n");

  try {
    for (let index = 0; index < options.visitors; index += 1) {
      const result = await simulateVisitor(browser, options, runId, index);
      totals.set(result.scenario, (totals.get(result.scenario) || 0) + 1);
      telemetryRequests += result.telemetryRequests;
      console.log(
        "[" + (index + 1) + "/" + options.visitors + "] " +
          result.scenario + " (" + result.telemetryRequests + " PostHog request(s))",
      );
    }
  } finally {
    await browser.close();
  }

  console.log("\nSimulation complete");
  console.table(Object.fromEntries(totals));
  console.log("Observed PostHog POST requests: " + telemetryRequests);
  console.log("Dashboard filter: synthetic_traffic = true");
  console.log("Run filter: simulation_run_id = " + runId);
}

main().catch((error) => {
  console.error("Simulation failed: " + error.message);
  process.exitCode = 1;
});
