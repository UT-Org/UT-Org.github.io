# ABC Tutoring prototype architecture

This is a dependency-free static prototype intended for GitHub Pages.

## File map

- `index.html` — semantic page structure and booking form markup.
- `assets/styles.css` — design tokens, component styles, and responsive rules.
- `assets/js/data.js` — prototype tutor and availability data.
- `assets/js/analytics.js` — PostHog initialization and the telemetry adapter.
- `assets/js/app.js` — rendering, event handling, booking flow, and UI state.
- `assets/tutor-portraits.png` — profile portrait sprite sheet.
- `scripts/simulate-traffic.mjs` — browser-driven synthetic traffic demo.

Scripts load in dependency order with `defer`: data, analytics, then application.

## Client-side state

In-memory client-side state is ideal for this prototype because there are no
accounts, no real inventory locks, and no server-side booking endpoint yet. The
`state` object near the top of `app.js` is the single source of truth for:

- active tutor filter;
- selected tutor;
- selected date and time;
- current booking step; and
- whether an unfinished booking is active.

Personally identifiable information is intentionally excluded from state and
browser storage. It remains in the form controls only and disappears on reload.
PostHog also receives no parent name, email address, or student name.

`localStorage` would be appropriate later for non-sensitive conveniences such
as restoring the last subject filter or an unfinished tutor/time selection. It
should not store parent or student details.

## Analytics boundary

`app.js` reports meaningful product events through
`ABCTutoringAnalytics.track()`. Only `analytics.js` knows about PostHog. This
keeps UI behavior testable and makes it straightforward to replace the analytics
provider.

The primary conversion funnel is:

1. `$pageview`
2. `tutor_availability_viewed`
3. `booking_details_viewed`
4. `booking_completed`

`booking_abandoned` includes the current stage and exit reason. Tutor, subject,
session format, and contact-interest events support Dana's remaining questions.
Simulator traffic is explicitly marked with `synthetic_traffic: true` and a
unique `simulation_run_id`, allowing demo data to be separated from real
reporting.

## Production migration

The current confirmation is simulated by `submitBooking()` in `app.js`.
Production work should replace that function's prototype behavior with a
server-side booking request that:

1. validates availability;
2. stores the booking securely;
3. sends email or SMS confirmation; and
4. returns a booking identifier for the confirmation screen.

Tutor and availability data can then move from `data.js` to the same API
without changing the page structure or analytics adapter.
