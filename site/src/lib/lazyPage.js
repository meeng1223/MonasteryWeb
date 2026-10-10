// Route-level code splitting: each page is its own JS chunk, loaded when the
// page is first shown.
//
// lazyPage(() => import("./pages/X.jsx")) returns a component with .preload().
// main.jsx preloads the current URL's page before the first render, so a page
// that is already loaded renders directly (no Suspense fallback replacing the
// prerendered HTML, no layout shift). Pages reached later by in-app navigation
// render through React.lazy; the router wraps navigations in startTransition
// (main.jsx), so the previous page stays on screen until the next one is ready.
import { createElement, lazy, useState } from "react";

const RELOAD_KEY = "chunkReloadAt";

// A chunk that fails to load is usually a stale tab after a new deploy (old
// file names are gone): reload once to get the current build. If that already
// happened in the last minute, fail normally instead of looping.
function recover(err) {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) || 0);
    if (Date.now() - last > 60000) {
      sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
      location.reload();
      return new Promise(() => {}); // keep showing the current page until the reload
    }
  } catch { /* storage blocked: fall through */ }
  throw err;
}

export function lazyPage(load) {
  let mod = null;
  let promise = null;
  const preload = () =>
    (promise ||= load().then(
      (m) => (mod = m),
      (err) => {
        promise = null;
        return recover(err);
      }
    ));
  const Lazy = lazy(preload);
  function Page(props) {
    // Decided once per mount, so a page never switches component type (and
    // loses its state) after its chunk arrives.
    const [Comp] = useState(() => (mod ? mod.default : Lazy));
    return createElement(Comp, props);
  }
  Page.preload = preload;
  return Page;
}
