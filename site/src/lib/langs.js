// Site languages and their URL prefixes. Plain JS (no JSX) so the build scripts
// (scripts/prerender.mjs) can import it too. English lives at the root; every
// other language under its own prefix: /vi, /zh-hk, /hi, /bo, /or.
// The same prefixes are hard-coded in index.html (inline script) and in the
// firebase.json rewrite/redirect regexes — prerender.mjs checks the latter.

// `code` is the internal code ("TIB" kept for backwards compatibility with
// localStorage and CMS code), `html` is the <html lang> / hreflang value,
// `label` is shown in its own script.
export const LANGUAGES = [
  { code: "EN", short: "EN", html: "en", label: "English", ogLocale: "en_US" },
  { code: "VI", short: "VI", html: "vi", label: "Tiếng Việt", ogLocale: "vi_VN" },
  { code: "ZH", short: "ZH", html: "zh-HK", label: "繁體中文", ogLocale: "zh_HK" },
  { code: "HI", short: "HI", html: "hi", label: "हिन्दी", ogLocale: "hi_IN" },
  { code: "TIB", short: "BO", html: "bo", label: "བོད་ཡིག", ogLocale: "bo_IN" },
  { code: "OR", short: "OR", html: "or", label: "ଓଡ଼ିଆ", ogLocale: "or_IN" },
];

// Language code -> URL prefix (no slashes). English = root.
export const PATH = { EN: "", VI: "vi", ZH: "zh-hk", HI: "hi", TIB: "bo", OR: "or" };

export const langMeta = (code) => LANGUAGES.find((l) => l.code === code) || LANGUAGES[0];

// Language of a URL path, from its first segment ("/vi/about" -> "VI").
// /admin is never prefixed, so it is always English.
export function langFromPath(pathname = "/") {
  const seg = pathname.split("/")[1]?.toLowerCase() || "";
  for (const code in PATH) if (PATH[code] && PATH[code] === seg) return code;
  return "EN";
}

// Path of `path` (an unprefixed app route like "/about") in language `code`.
export function localePath(code, path = "/") {
  const p = PATH[code];
  if (!p) return path || "/";
  return "/" + p + (!path || path === "/" ? "" : path);
}
