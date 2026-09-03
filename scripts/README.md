# Synthetic traffic demo

The simulator uses Playwright to exercise the real ABC Tutoring interface through
isolated browser contexts. It covers five behaviors:

- landing-page bounce;
- subject and tutor browsing;
- abandonment on the availability step;
- abandonment on the details step; and
- completed prototype booking.

Every PostHog event from these visits is labeled with the event properties
**synthetic_traffic: true** and a unique **simulation_run_id**. Never present
synthetic data as real customer activity.

## Setup

~~~powershell
npm.cmd install
npm.cmd run install:browser
~~~

On Windows PowerShell, use `npm.cmd` rather than `npm` if script execution
policy blocks the `npm.ps1` shim. This does not require changing the machine's
execution policy.

## Run against GitHub Pages

~~~powershell
npm.cmd run simulate:traffic -- --url https://ut-org.github.io --visitors 25
~~~

The URL must be entered as plain text. Do not include Markdown brackets or
parentheses such as `[https://example.com](https://example.com)`.

The simulator also verifies that the target page title contains
`ABC Tutoring`. If it reports no title, deploy the current repository changes
to GitHub Pages before running against the public URL.

Add **--headed** to watch the browser interactions:

~~~powershell
npm.cmd run simulate:traffic -- --url https://ut-org.github.io --visitors 8 --headed
~~~

## Run locally

First serve the repository with any static server. For example:

~~~powershell
npx.cmd serve .
~~~

Then copy the displayed local URL:

~~~powershell
npm.cmd run simulate:traffic -- --url http://localhost:3000 --visitors 20
~~~

## PostHog

Use these event-property filters in PostHog:

- Demo-only dashboard: **synthetic_traffic = true**
- Real reporting: **synthetic_traffic = false**
- One run: **simulation_run_id = the ID printed by the script**

The script prints how many PostHog POST requests it observed. Events can take a
short time to become visible in PostHog.

The simulator disables request batching only inside its isolated synthetic
browser sessions, ensuring that its delivery check does not depend on the
deployed site's normal batching configuration.

If the SDK or ingestion request is blocked, the simulator exits with a diagnostic
error instead of reporting a successful run with zero PostHog requests. Common
causes are DNS filtering, firewalls, and browser privacy or ad-blocking rules for
PostHog domains.
