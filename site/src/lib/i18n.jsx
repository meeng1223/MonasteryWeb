import { createContext, useContext, useLayoutEffect } from "react";
import { LANGUAGES, langMeta } from "./langs.js";

export { LANGUAGES, PATH, langFromPath, localePath } from "./langs.js";

// The page language comes from the URL only (see main.jsx); it never changes
// while a page is open — switching language is a full navigation.
const LangCtx = createContext({ lang: "EN" });
export const useLang = () => useContext(LangCtx);

// English -> language dictionaries, each loaded on demand (only English ships in
// the main bundle; Tibetan alone is ~1 MB of text).
const LOADERS = {
  TIB: () => import("./translations.js").then((m) => ({ default: m.TIB })),
  ZH: () => import("./i18n/zh.json"),
  VI: () => import("./i18n/vi.json"),
  OR: () => import("./i18n/or.json"),
  HI: () => import("./i18n/hi.json"),
};

// Site language -> suffix of the CMS field that holds that language.
const CMS_SUFFIX = { TIB: "bo", ZH: "zh", VI: "vi", HI: "hi", OR: "or" };

// Pick a CMS document's field for the active language (`<field>_<suffix>`),
// falling back to the English field when that language is empty.
export function localized(doc, field, lang) {
  if (!doc) return "";
  const sfx = CMS_SUFFIX[lang];
  return (sfx && doc[`${field}_${sfx}`]) || doc[field] || "";
}

// Languages a CMS article really exists in: English plus every language whose
// title and body are both filled in.
export function articleLangs(doc) {
  return ["EN", ...Object.keys(CMS_SUFFIX).filter((code) => {
    const sfx = CMS_SUFFIX[code];
    return String(doc?.[`title_${sfx}`] || "").trim() && String(doc?.[`body_${sfx}`] || "").trim();
  })];
}

// Original-value stores so we can restore English when switching language.
const TEXT_ORIG = new WeakMap(); // textNode -> original English nodeValue
const TEXT_APPLIED = new WeakMap(); // textNode -> value we wrote (detects React re-renders)
const ATTR_ORIG = new WeakMap(); // element -> Map(attr -> original value)
const TRANSLATABLE_ATTRS = ["placeholder", "alt", "title", "aria-label"];
const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA"]);

// Build a whitespace-normalized index so dictionary keys still match even when
// JSX collapses internal newlines/indentation in rendered text nodes.
const norm = (s) => s.replace(/\s+/g, " ").trim();
const indexDict = (d) => {
  const out = {};
  for (const k in d) out[norm(k)] = d[k];
  return out;
};
const DICTS = {};

export async function loadDict(code) {
  if (code === "EN") return null;
  if (!DICTS[code] && LOADERS[code]) DICTS[code] = indexDict((await LOADERS[code]()).default);
  return DICTS[code] || null;
}

function lookup(dict, raw) {
  if (!raw || !dict) return null;
  const key = norm(raw);
  if (!key) return null;
  const t = dict[key];
  if (!t || t === key) return null;
  // preserve leading/trailing whitespace of the original node
  const lead = raw.match(/^\s*/)[0];
  const trail = raw.match(/\s*$/)[0];
  return lead + t + trail;
}

// Translate one string (e.g. a page title) with an already-loaded dictionary.
// "A | B" titles fall back to translating each part.
export function t(str, lang) {
  const dict = DICTS[lang];
  if (!str || !dict) return str;
  const whole = lookup(dict, str);
  if (whole != null) return whole;
  if (!str.includes(" | ")) return str;
  return str.split(" | ").map((part) => lookup(dict, part) ?? part).join(" | ");
}

// Translate every text node / attribute under `root` with `dict`
// (null = restore English).
function translateTree(root, dict) {
  if (!root) return;

  // --- text nodes ---
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const p = node.parentElement;
      if (!p || SKIP_TAGS.has(p.tagName) || p.closest("[data-no-translate]")) return NodeFilter.FILTER_REJECT;
      if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  const textNodes = [];
  let n;
  while ((n = walker.nextNode())) textNodes.push(n);

  for (const node of textNodes) {
    // React may have replaced the text since we translated it: treat it as new English.
    if (TEXT_ORIG.has(node) && node.nodeValue !== TEXT_APPLIED.get(node)) {
      TEXT_ORIG.delete(node);
      TEXT_APPLIED.delete(node);
    }
    const orig = TEXT_ORIG.has(node) ? TEXT_ORIG.get(node) : node.nodeValue;
    const t = lookup(dict, orig);
    if (t != null) {
      if (!TEXT_ORIG.has(node)) TEXT_ORIG.set(node, orig);
      if (node.nodeValue !== t) node.nodeValue = t;
      TEXT_APPLIED.set(node, t);
    } else if (TEXT_ORIG.has(node)) {
      node.nodeValue = orig;
      TEXT_ORIG.delete(node);
      TEXT_APPLIED.delete(node);
    }
  }

  // --- translatable attributes ---
  for (const attr of TRANSLATABLE_ATTRS) {
    root.querySelectorAll(`[${attr}]`).forEach((el) => {
      let m = ATTR_ORIG.get(el);
      const orig = m && m.has(attr) ? m.get(attr) : el.getAttribute(attr);
      const t = lookup(dict, orig);
      if (t != null) {
        if (!m) ATTR_ORIG.set(el, (m = new Map()));
        if (!m.has(attr)) m.set(attr, orig);
        if (el.getAttribute(attr) !== t) el.setAttribute(attr, t);
      } else if (m && m.has(attr)) {
        el.setAttribute(attr, orig);
        m.delete(attr);
      }
    });
  }
}

// `lang` comes from the URL (main.jsx), which loads its dictionary before the
// first render, so the first commit is translated before the browser paints it.
export function LanguageProvider({ lang, children }) {
  useLayoutEffect(() => {
    // Hint only (newsletter sign-ups, the saved-language redirect in main.jsx):
    // never read to decide the language of a page. An English page shown while
    // another language is chosen (/admin, a 404) must not overwrite the choice.
    try {
      if (!(lang === "EN" && localStorage.getItem("langChosen") === "1")) localStorage.setItem("lang", lang);
    } catch { /* storage blocked */ }
    const root = document.getElementById("root");
    const meta = langMeta(lang);
    const html = document.documentElement;
    html.lang = meta.html;
    for (const l of LANGUAGES) html.classList.toggle(`lang-${l.html.split("-")[0]}`, l.code === lang);
    html.classList.toggle("lang-tib", lang === "TIB"); // existing Tibetan styles

    let dict = DICTS[lang] || null;
    let raf = 0;
    let timer = 0;
    let settle = 0;
    let cancelled = false;
    // html[data-i18n] = lang once the page has had no DOM changes for 300 ms
    // after a translation pass (the prerender waits for it).
    const markSettled = () => {
      clearTimeout(settle);
      settle = setTimeout(() => { html.dataset.i18n = lang; }, 300);
    };
    const translate = () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      raf = timer = 0;
      if (dict) translateTree(root, dict);
      markSettled();
    };
    // rAF for smoothness, plus a timer fallback for hidden tabs (rAF paused).
    const run = () => {
      if (raf || timer) return;
      raf = requestAnimationFrame(translate);
      timer = setTimeout(translate, 100);
    };

    if (lang !== "EN" && !dict) {
      loadDict(lang).then((d) => {
        if (cancelled) return;
        dict = d;
        run();
      });
    } else {
      translate(); // synchronous: before the first paint
    }

    // Re-apply after React re-renders / route changes / async content.
    const observer = new MutationObserver(() => {
      delete html.dataset.i18n;
      run();
    });
    observer.observe(root, { childList: true, subtree: true, characterData: true });

    // Catch late async content (e.g. Firestore-loaded news/gallery) that may
    // settle after the last mutation, beating the observer.
    const timers = [250, 800, 1800, 3500].map((ms) => setTimeout(run, ms));

    return () => {
      cancelled = true;
      observer.disconnect();
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      clearTimeout(settle);
      timers.forEach(clearTimeout);
    };
  }, [lang]);

  return <LangCtx.Provider value={{ lang }}>{children}</LangCtx.Provider>;
}
