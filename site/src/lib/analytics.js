// Google Analytics 4 (gtag.js), measurement ID G-Y0XY8K7S7G (VITE_GA_MEASUREMENT_ID
// overrides it). Loads only on the live domain (so local dev, previews and the
// build-time prerender never send hits), and only after the visitor accepts the
// consent banner (components/ConsentBanner.jsx).
// For testing on another host: localStorage.setItem("ga_debug", "1") — hits then
// go to GA DebugView instead of the normal reports.
//
// Page views are sent manually by <Seo/> after it has set the page title, so in
// GA Admin → Data streams → Enhanced measurement, turn OFF "Page changes based
// on browser history events" (otherwise each page is counted twice).

const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || "G-Y0XY8K7S7G";
const LIVE_HOSTS = ["dundulraptenling.org", "www.dundulraptenling.org"];
const CONSENT_KEY = "dr-analytics-consent";

function debugOn() {
  try { return localStorage.getItem("ga_debug") === "1"; } catch { return false; }
}

// Analytics can run on this host at all (live domain or debug mode).
export const analyticsAvailable =
  typeof window !== "undefined" &&
  Boolean(GA_ID) &&
  !navigator.webdriver &&
  (LIVE_HOSTS.includes(location.hostname) || debugOn());

// The visitor's choice from the consent banner: "granted", "denied" or null.
export function readConsent() {
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
}

// Google's gtag.js is requested ONLY after the visitor accepts. Before that the
// site makes no request to Google at all. (Loading it up front is also what
// makes Safari Private Browsing show "reduce advanced privacy protections".)
let loaded = false;
let lastPage = null; // the current page, sent once analytics starts

function start() {
  if (loaded || !analyticsAvailable) return;
  loaded = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() { window.dataLayer.push(arguments); };
  window.gtag("js", new Date());
  window.gtag("config", GA_ID, {
    send_page_view: false,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    ...(debugOn() ? { debug_mode: true } : {}),
  });

  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(s);

  // Donations go through Zeffy (links and the embedded form's links).
  document.addEventListener("click", (e) => {
    const a = e.target.closest?.('a[href*="zeffy.com"]');
    if (a) trackEvent("donate_click", { link_url: a.href, page_path: location.pathname });
  }, true);

  if (lastPage) trackPageView(lastPage.path, lastPage.title);
}

export function setConsent(value) {
  try { localStorage.setItem(CONSENT_KEY, value); } catch { /* private mode: this visit only */ }
  if (value === "granted") start();
}

if (analyticsAvailable && readConsent() === "granted") start();

export function trackPageView(path, title) {
  lastPage = { path, title };
  if (!loaded) return;
  window.gtag("event", "page_view", {
    page_path: path,
    page_location: location.origin + path + location.search,
    page_title: title,
  });
}

export function trackEvent(name, params = {}) {
  if (!loaded) return;
  window.gtag("event", name, params);
}
