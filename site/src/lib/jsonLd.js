// Page-level structured data (schema.org JSON-LD) added to <head> while a page
// is shown, so the prerender bakes it into the page's static HTML.
//
// Every block carries data-ld="<key>". main.jsx removes the prerendered copies
// before the app mounts and the page adds them back, so a page never ends up
// with two copies of the same block. The site-wide PlaceOfWorship block in
// index.html has no data-ld and is never touched.
import { useEffect } from "react";
import { SITE_URL, localePath } from "./seo.js";
import { langMeta } from "./langs.js";

export const SCHEMA_CONTEXT = "https://schema.org";

// Absolute canonical URL of an unprefixed path in language `code`.
export const canonicalUrl = (code, path) => SITE_URL + localePath(code, path);

// BCP 47 tag of a site language code (same as <html lang>).
export const inLanguage = (code) => langMeta(code).html;

// Adds `data` (a schema.org object without @context) as one JSON-LD block.
// null/undefined = nothing.
export function useJsonLd(key, data) {
  const json = data ? JSON.stringify({ "@context": SCHEMA_CONTEXT, ...data }) : "";
  useEffect(() => {
    if (!json) return undefined;
    const el = document.createElement("script");
    el.type = "application/ld+json";
    el.dataset.ld = key;
    el.textContent = json;
    document.head.appendChild(el);
    return () => el.remove();
  }, [key, json]);
}

// Drops the JSON-LD blocks a prerendered snapshot carries (see above).
export function removePrerenderedJsonLd() {
  document.head.querySelectorAll('script[type="application/ld+json"][data-ld]').forEach((el) => el.remove());
}

// BreadcrumbList from a visible breadcrumb trail ([{ label, to? }], last item =
// current page). Middle items without a link (menu headings such as "Media &
// News") have no page of their own, so they are left out; the last item has no
// URL (Google uses the page itself). `label`s are translated with `tr`.
export function breadcrumbList(trail, lang, tr = (s) => s) {
  const items = trail.filter((c, i) => c.to || i === trail.length - 1);
  if (items.length < 2) return null;
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: tr(String(c.label)),
      ...(c.to && i < items.length - 1 ? { item: canonicalUrl(lang, c.to) } : {}),
    })),
  };
}
