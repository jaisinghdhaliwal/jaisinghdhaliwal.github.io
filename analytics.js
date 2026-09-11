const analyticsPreference = "cloudflare-analytics-opt-out";
const pageUrl = new URL(window.location.href);
const requestedChoice = pageUrl.searchParams.get("analytics");
let analyticsDisabled = false;

try {
  if (requestedChoice === "off") localStorage.setItem(analyticsPreference, "true");
  if (requestedChoice === "on") localStorage.removeItem(analyticsPreference);
  analyticsDisabled = localStorage.getItem(analyticsPreference) === "true";

  if (requestedChoice === "off" || requestedChoice === "on") {
    pageUrl.searchParams.delete("analytics");
    history.replaceState(null, "", `${pageUrl.pathname}${pageUrl.search}${pageUrl.hash}`);
  }
} catch {
  analyticsDisabled = requestedChoice === "off";
}

function loadAnalytics() {
  if (analyticsDisabled || document.querySelector("[data-cf-beacon]")) return;
  const beacon = document.createElement("script");
  beacon.type = "module";
  beacon.src = "https://static.cloudflareinsights.com/beacon.min.js";
  beacon.dataset.cfBeacon = JSON.stringify({ token: "1197fb89991344e5bac134ee95b88fd0" });
  document.head.append(beacon);
}

function scheduleAnalytics() {
  const interactionEvents = ["pointerdown", "keydown", "touchstart", "scroll"];
  let fallback;

  const start = () => {
    window.clearTimeout(fallback);
    interactionEvents.forEach((eventName) => window.removeEventListener(eventName, start));

    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(loadAnalytics, { timeout: 2000 });
    } else {
      window.setTimeout(loadAnalytics, 0);
    }
  };

  interactionEvents.forEach((eventName) => {
    window.addEventListener(eventName, start, { once: true, passive: true });
  });

  // Preserve analytics for passive visits without putting the beacon in the
  // initial loading path measured by performance tools.
  fallback = window.setTimeout(start, 10000);
}

if (!analyticsDisabled) {
  if (document.readyState === "complete") scheduleAnalytics();
  else window.addEventListener("load", scheduleAnalytics, { once: true });
}

function updateAnalyticsChoice() {
  document.querySelectorAll("[data-analytics-choice]").forEach((link) => {
    link.href = analyticsDisabled ? "?analytics=on" : "?analytics=off";
    link.textContent = analyticsDisabled ? "Allow anonymous analytics" : "Opt out of analytics";
  });
}

updateAnalyticsChoice();
document.addEventListener("DOMContentLoaded", updateAnalyticsChoice, { once: true });
