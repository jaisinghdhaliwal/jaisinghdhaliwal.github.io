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

if (!analyticsDisabled) {
  const beacon = document.createElement("script");
  beacon.type = "module";
  beacon.src = "https://static.cloudflareinsights.com/beacon.min.js";
  beacon.dataset.cfBeacon = JSON.stringify({ token: "1197fb89991344e5bac134ee95b88fd0" });
  document.head.append(beacon);
}

function updateAnalyticsChoice() {
  document.querySelectorAll("[data-analytics-choice]").forEach((link) => {
    link.href = analyticsDisabled ? "?analytics=on" : "?analytics=off";
    link.textContent = analyticsDisabled ? "Allow anonymous analytics" : "Opt out of analytics";
  });
}

updateAnalyticsChoice();
document.addEventListener("DOMContentLoaded", updateAnalyticsChoice, { once: true });
