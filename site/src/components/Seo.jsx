import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { SITE_URL, DEFAULT_IMAGE, getSeo, alternates, localePath } from "../lib/seo.js";
import { trackPageView } from "../lib/analytics.js";
import { useLang, t, LANGUAGES } from "../lib/i18n.jsx";

function setMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setCanonical(href) {
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

// Replaces every hreflang <link> with `links` ([{ hreflang, href }]).
export function setAlternates(links) {
  document.head.querySelectorAll('link[rel="alternate"][hreflang]').forEach((el) => el.remove());
  for (const { hreflang, href } of links) {
    const el = document.createElement("link");
    el.setAttribute("rel", "alternate");
    el.setAttribute("hreflang", hreflang);
    el.setAttribute("href", href);
    document.head.appendChild(el);
  }
}

// Writes title, description, canonical, hreflang and share tags for language
// `lang`. `path` is the unprefixed canonical path ("/about"). Title and
// description are translated through the active dictionary unless
// `translate: false` (already-localized CMS text). `langs` = languages this
// page exists in (hreflang); `canonicalLang` = language of the canonical URL
// (English for an untranslated article). Also used by pages whose content
// loads later (NewsDetail) to replace the route defaults.
export function applySeo({ title, description, path, image, lang = "EN", langs, canonicalLang = lang, translate = true }) {
  const url = SITE_URL + localePath(canonicalLang, path);
  if (translate) {
    title = t(title, lang);
    description = t(description, lang);
  }
  document.title = title;
  setMeta("name", "description", description);
  setCanonical(url);
  setAlternates(alternates(path, langs));
  setMeta("property", "og:title", title);
  setMeta("property", "og:description", description);
  setMeta("property", "og:url", url);
  setMeta("property", "og:locale", (LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0]).ogLocale);
  setMeta("property", "og:image", image || DEFAULT_IMAGE);
  setMeta("name", "twitter:title", title);
  setMeta("name", "twitter:description", description);
  setMeta("name", "twitter:image", image || DEFAULT_IMAGE);
}

// Render on "not found" states: the SPA answers every URL with HTTP 200, so this
// keeps missing pages out of Google's index. Removed again on unmount.
export function NoIndex() {
  useEffect(() => {
    const el = document.createElement("meta");
    el.setAttribute("name", "robots");
    el.setAttribute("content", "noindex");
    document.head.appendChild(el);
    return () => el.remove();
  }, []);
  return null;
}

// Keeps <title> and meta tags in sync with the current route.
export default function Seo() {
  const { pathname } = useLocation();
  const { lang } = useLang();

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    const seo = getSeo(pathname);
    applySeo({ ...seo, path: seo.canonical || pathname, lang });
    trackPageView(localePath(lang, pathname), seo.title);
  }, [pathname, lang]);

  return null;
}
