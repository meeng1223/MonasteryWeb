import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App, { preloadRoute } from "./App.jsx";
import { LanguageProvider, loadDict, langFromPath, localePath, PATH } from "./lib/i18n.jsx";
import { PAGE_SEO } from "./lib/seo.js";
import { getMaster } from "./data/masters.js";
import { removePrerenderedJsonLd } from "./lib/jsonLd.js";
import "./tabler-icons.css";
import "./index.css";
import "./tailwind.css";

// The URL is the only source of the page language: "/vi/about" is Vietnamese,
// "/about" English. The router runs under the language prefix, so every
// <Link to="/about"> stays inside the current language.
const lang = langFromPath(location.pathname);
const prefix = PATH[lang];

// Visitors who explicitly picked a language in the switcher (langChosen=1)
// and open a plain English link to a real public page (/about, /puja,
// /news/<id> ...) land on that page in their language, keeping query + hash.
// Never for /admin or unknown paths (they stay 404s), never for crawlers or
// the prerender (no storage / navigator.webdriver). Choosing English in the
// switcher clears the choice, so English stays reachable.
function isPublicRoute(path) {
  if (PAGE_SEO[path] || /^\/news\/[^/]+$/.test(path)) return true;
  const m = path.match(/^\/(vajra-masters|presidents)\/([^/]+)$/);
  const master = m && getMaster(m[2]);
  return !!master && master.groups.includes(m[1] === "presidents" ? "president" : "vajra");
}

function savedLanguageUrl() {
  try {
    if (navigator.webdriver) return null;
    // One-time migration: before language URLs, "lang" was only written by
    // the switcher, so a non-English value there was an explicit choice.
    if (!localStorage.getItem("langUrls")) {
      const old = localStorage.getItem("lang");
      if (old && old !== "EN" && PATH[old]) localStorage.setItem("langChosen", "1");
      localStorage.setItem("langUrls", "1");
    }
    if (localStorage.getItem("langChosen") !== "1") return null;
    const saved = localStorage.getItem("lang");
    if (!saved || saved === "EN" || !PATH[saved]) return null;
    const path = location.pathname.replace(/\/+$/, "") || "/";
    if (!isPublicRoute(path)) return null;
    return localePath(saved, path) + location.search + location.hash;
  } catch {
    return null; // storage blocked
  }
}

const redirect = lang === "EN" ? savedLanguageUrl() : null;
if (redirect) {
  location.replace(redirect);
} else {
  // A prerendered snapshot may carry another page's marker.
  delete document.documentElement.dataset.i18n;
  // ...and the page's structured data, which the page adds again when it mounts.
  removePrerenderedJsonLd();
  // Unprefixed app path ("/vi/about" -> "/about"), for the router basename.
  const appPath = prefix ? location.pathname.slice(prefix.length + 1) || "/" : location.pathname;
  // Load the dictionary and the page's own chunk first, so the first commit is
  // already the full translated page (it replaces the prerendered HTML).
  Promise.all([loadDict(lang).catch(() => null), preloadRoute(appPath)])
    .then(() => {
      ReactDOM.createRoot(document.getElementById("root")).render(
        <React.StrictMode>
          <BrowserRouter basename={prefix ? "/" + prefix : "/"} future={{ v7_startTransition: true }}>
            <LanguageProvider lang={lang}>
              <App />
            </LanguageProvider>
          </BrowserRouter>
        </React.StrictMode>
      );
    });
}
