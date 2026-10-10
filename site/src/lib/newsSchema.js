// NewsArticle structured data for /news/<slug> pages.
// https://developers.google.com/search/docs/appearance/structured-data/article
// Plain JS (no JSX, no import.meta.env) so it can be checked from Node.
import { SITE_URL } from "./seo.js";

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

export const MONASTERY_ORG = {
  "@type": "Organization",
  name: "Dundul Raptenling Monastery",
  url: SITE_URL + "/",
};

const PUBLISHER = {
  ...MONASTERY_ORG,
  logo: { "@type": "ImageObject", url: SITE_URL + "/favicon.png" },
};

const pad = (n) => String(n).padStart(2, "0");
const monthIndex = (word) => MONTHS.indexOf(String(word).slice(0, 3).toLowerCase());
const validIso = (s) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}T/.test(s) && !Number.isNaN(Date.parse(s));

// The article's shown date (free text in the CMS: "January 19, 2022",
// "October 2026", "Sept 2026") -> { y, m, d? } or null.
export function parseShownDate(text) {
  const s = String(text || "").trim().replace(/\s+/g, " ");
  let m = s.match(/^([A-Za-z]+)\.? (\d{1,2})(?:st|nd|rd|th)?,? (\d{4})$/);
  if (m && monthIndex(m[1]) >= 0) return { y: +m[3], m: monthIndex(m[1]) + 1, d: +m[2] };
  m = s.match(/^(\d{1,2}) ([A-Za-z]+)\.?,? (\d{4})$/);
  if (m && monthIndex(m[2]) >= 0) return { y: +m[3], m: monthIndex(m[2]) + 1, d: +m[1] };
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return { y: +m[1], m: +m[2], d: +m[3] };
  m = s.match(/^([A-Za-z]+)\.? (\d{4})$/);
  if (m && monthIndex(m[1]) >= 0) return { y: +m[2], m: monthIndex(m[1]) + 1 };
  return null;
}

// Calendar date of an ISO timestamp in UTC and in India (+05:30), "YYYY-MM-DD".
function localDays(iso) {
  const t = Date.parse(iso);
  const day = (ms) => new Date(ms).toISOString().slice(0, 10);
  return [day(t), day(t + 5.5 * 3600e3)];
}

// datePublished from the article's real fields, never invented:
// - the CMS entry time (createdAt, with timezone) when it falls on the shown
//   date / in the shown month (posts written when the news happened);
// - else the shown date itself when it is a full date, as midnight in India
//   ("2022-01-19T00:00:00+05:30": posts copied from the old site keep their
//   original day; Google wants a time and timezone on article dates);
// - else nothing (only a month is shown and the entry was made later, or the
//   shown date can't be read).
export function articleDatePublished(doc) {
  const shown = parseShownDate(doc?.date);
  const created = validIso(doc?.createdAt) ? doc.createdAt : null;
  if (!shown) return String(doc?.date || "").trim() ? null : created; // unreadable shown date: don't guess
  const ym = `${shown.y}-${pad(shown.m)}`;
  if (created) {
    const days = localDays(created);
    if (shown.d ? days.includes(`${ym}-${pad(shown.d)}`) : days.some((d) => d.startsWith(ym))) return created;
  }
  return shown.d ? `${ym}-${pad(shown.d)}T00:00:00+05:30` : null;
}

// NewsArticle for an article shown in language `inLanguage` (BCP 47) at
// canonical URL `url`. `headline`/`description` = the page's title and meta
// description; `images` = absolute image URLs (cover first).
export function newsArticle(doc, { url, inLanguage, headline, description, images = [] }) {
  const datePublished = articleDatePublished(doc);
  const updated = validIso(doc?.updatedAt) ? doc.updatedAt : null;
  const dateModified = updated && (!datePublished || Date.parse(updated) >= Date.parse(datePublished)) ? updated : null;
  const image = [...new Set(images.filter(Boolean).map((src) => (src.startsWith("/") ? SITE_URL + src : src)))]
    .filter((src) => /^https?:\/\//.test(src));
  const author = doc?.author && typeof doc.author === "string" ? { "@type": "Person", name: doc.author } : MONASTERY_ORG;
  return {
    "@type": "NewsArticle",
    headline,
    ...(description ? { description } : {}),
    ...(image.length ? { image } : {}),
    ...(datePublished ? { datePublished } : {}),
    ...(dateModified ? { dateModified } : {}),
    author,
    publisher: PUBLISHER,
    mainEntityOfPage: url,
    inLanguage,
  };
}
