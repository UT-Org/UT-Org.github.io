/**
 * PostHog adapter.
 *
 * UI code calls Analytics.track() rather than depending directly on PostHog.
 * Form values containing names or email addresses are never passed here.
 */
(function initializeAnalytics() {
  const config = window.ABCTutoringConfig?.posthog;
  const projectToken = config?.projectToken;
  const host = config?.host;
  const query = new URLSearchParams(window.location.search);
  const isSyntheticTraffic = query.get("simulation") === "true";
  const simulationRunId = query.get("simulation_run_id") || undefined;

  window.ABCTutoringAnalytics = {
    track() {},
  };

  if (!projectToken || !host) {
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      const missingVariable = !projectToken ? "POSTHOG_PROJECT_TOKEN" : "POSTHOG_HOST";
      throw new Error(
        `${missingVariable} variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once ${missingVariable} is configured`,
      );
    }
    return;
  }

  !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once unregister get_distinct_id get_session_id opt_in_capturing opt_out_capturing has_opted_out_capturing reset".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);

  window.posthog.init(projectToken, {
    api_host: host,
    defaults: "2026-05-30",
    person_profiles: "identified_only",
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: true,
    disable_session_recording: true,
    mask_all_text: true,
    mask_all_element_attributes: true,
    request_batching: false,
    capture_exceptions: {
      capture_unhandled_errors: true,
      capture_unhandled_rejections: true,
      capture_console_errors: false,
    },
    loaded(posthog) {
      posthog.register({
        site_name: "ABC Tutoring",
        site_version: "prototype_v2",
        synthetic_traffic: isSyntheticTraffic,
        ...(simulationRunId && { simulation_run_id: simulationRunId }),
      });
      posthog.capture("$pageview");
      window.__ABC_POSTHOG_READY__ = true;
    },
  });

  window.ABCTutoringAnalytics = {
    track(eventName, properties = {}) {
      window.posthog.capture(eventName, {
        event_version: 1,
        ...properties,
      });
    },
  };
})();
