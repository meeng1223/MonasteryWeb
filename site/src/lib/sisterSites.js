// Links to the Zangdok Palri sister sites, in the visitor's current language.
// Both sites use language path prefixes: /vi, /zh-hk, /hi, /bo, /or (English = root).
import { useLang, PATH as SISTER_PATH } from "./i18n.jsx";

// Zangdok Palri Consecration 2028 — event page, or its registration page.
export function consecrationUrl(lang, page = "") {
  const p = SISTER_PATH[lang];
  return `https://2028.zangdokpalriodisha.com/${[p, page].filter(Boolean).join("/")}`;
}

// Plan your visit: transport, stay, permits.
export function travelUrl(lang) {
  const p = SISTER_PATH[lang];
  return `https://travel.zangdokpalriodisha.com/${p ? p + "/" : ""}`;
}

export function useSisterLinks() {
  const { lang } = useLang();
  return {
    consecration: consecrationUrl(lang),
    register: consecrationUrl(lang, "register"),
    travel: travelUrl(lang),
  };
}
