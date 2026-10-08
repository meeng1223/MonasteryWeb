// Prerender static routes to real HTML so non-JS crawlers (Google without
// rendering, and social-preview bots: Facebook, Zalo, Twitter, LinkedIn) see
// the correct per-page <title>/description and page content.
//
// Runs after `vite build` (see the "postbuild" npm script). Serves the built
// dist/ with `vite preview`, loads each route in headless Chrome, waits for
// React + <Seo/> to run, and writes the rendered HTML back into dist/.
// Fails the build (exit 1) if Chrome can't be found/launched or a page can't be
// rendered: a build without prerender ships pages without their per-page meta.
// SKIP_PRERENDER=1 skips it on purpose — local dev only, never for a deploy.
//
// Also writes dist/404.html (the NotFound page, noindex), which Firebase Hosting
// serves with HTTP 404 for any URL not matched by a rewrite in firebase.json,
// and checks that firebase.json has a rewrite for every route in src/App.jsx.
//
// Also prerenders every news article linked from /news (content from Firestore;
// articles live at /news/<slug>, see src/lib/newsSlug.js), writes a redirect
// page at each article's old /news/<id> URL (in every language), and writes dist/sitemap.xml from the pages that rendered, keeping the
// priorities from public/sitemap.xml. Pages whose canonical URL points elsewhere
// (people listed under both /presidents and /vajra-masters, untranslated
// articles in another language) or that are noindex are left out of the sitemap.
//
// Every page is rendered in all six languages (English at the root, the others
// under /vi, /zh-hk, /hi, /bo, /or -> dist/<prefix>/<route>/index.html), four
// pages at a time. Each translated page must have the right <html lang>, a
// self-referencing canonical, its hreflang set (7 links on normal pages) and the
// same JSON-LD as English, or the build fails. A coverage report prints the
// share of visible text still identical to English per page (warning > 40%).

import { spawn } from "node:child_process";
import { mkdir, writeFile, readFile, access } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

import { PAGE_SEO, SITE_URL, alternates } from "../src/lib/seo.js";
import { LANGUAGES, PATH, localePath, langMeta } from "../src/lib/langs.js";
import { NOT_FOUND_TITLE } from "../src/lib/notFound.js";
import { MASTERS } from "../src/data/masters.js";
import { newsSlugMap } from "../src/lib/newsSlug.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(__dirname, "../dist");
const PORT = 4183;
const ORIGIN = `http://localhost:${PORT}`;
const POOL = 4; // pages rendered in parallel
const COVERAGE_WARN = 0.4; // warn when more than 40% of a page's text is still English
const CODES = LANGUAGES.map((l) => l.code);
const OTHER = CODES.filter((c) => c !== "EN");

const CHROME_CANDIDATES = [
  process.env.PUPPETEER_EXECUTABLE_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
].filter(Boolean);

async function findChrome() {
  for (const p of CHROME_CANDIDATES) {
    try { await access(p); return p; } catch { /* keep looking */ }
  }
  return null;
}

// Build the route list: every static SEO page + every master detail page.
function routes() {
  const set = new Set(Object.keys(PAGE_SEO));
  for (const m of MASTERS) {
    if (m.groups.includes("vajra")) set.add(`/vajra-masters/${m.slug}`);
    if (m.groups.includes("president")) set.add(`/presidents/${m.slug}`);
  }
  return [...set];
}

// Thrown for expected failures; main() prints it and exits 1 (after cleanup).
class PrerenderError extends Error {}
function fail(msg) {
  throw new PrerenderError(msg);
}

// Firebase Hosting glob -> RegExp ("**" any depth, "*" one path segment).
function globRe(glob) {
  const re = glob
    .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\*\*/g, "\0")
    .replace(/\*/g, "[^/]*")
    .replace(/\0/g, ".*");
  return new RegExp(`^${re}$`);
}

// Every public route in App.jsx (dynamic segments filled with real slugs or a
// sample id) must be served by firebase.json — otherwise it would answer 404.
async function checkHostingRoutes() {
  const fb = JSON.parse(await readFile(resolve(__dirname, "../firebase.json"), "utf8"));
  const { rewrites = [], redirects = [] } = fb.hosting;
  // Firebase regexes are RE2: named groups are (?P<name>...), (?<name>...) in JS.
  const toRe = (r) => (r.regex ? new RegExp(r.regex.replace(/\(\?P</g, "(?<")) : globRe(r.source));
  const sources = [...rewrites, ...redirects].map((r) => {
    if (r.regex) return toRe(r);
    if (r.source === "**") fail('firebase.json has a catch-all "**" rewrite — unknown URLs would answer 200 instead of 404.');
    return globRe(r.source);
  });
  const app = await readFile(resolve(__dirname, "../src/App.jsx"), "utf8");
  const paths = [...app.matchAll(/path="(\/[^"]*)"/g)].map((m) => m[1]);
  const expanded = [];
  for (const p of paths) {
    const m = p.match(/^\/(vajra-masters|presidents)\/:slug$/);
    if (m) {
      const group = m[1] === "presidents" ? "president" : "vajra";
      for (const x of MASTERS) if (x.groups.includes(group)) expanded.push(`/${m[1]}/${x.slug}`);
    } else {
      expanded.push(p.replace(/:[^/]+/g, "sample-id"));
    }
  }
  // Every public route also exists under each language prefix.
  for (const r of [...expanded]) {
    if (r.startsWith("/admin")) continue;
    for (const code of OTHER) expanded.push(localePath(code, r));
  }
  expanded.push("/admin/news", "/admin/news/new", "/admin/news/sample-id");
  const missing = expanded.filter((r) => r !== "/" && !sources.some((re) => re.test(r)));
  if (missing.length) {
    fail(`firebase.json has no rewrite for these app routes (they would answer 404):\n  ${missing.join("\n  ")}\n` +
      `Add a { "source": ..., "destination": "/index.html" } rewrite for each.`);
  }
  // /admin is never language-prefixed, and unknown prefixed URLs must stay 404s.
  const rewriteRes = rewrites.map(toRe);
  const mustNotMatch = [];
  for (const p of Object.values(PATH).filter(Boolean)) {
    mustNotMatch.push(`/${p}/admin`, `/${p}/admin/login`, `/${p}/admin/news`, `/${p}/__no-such-page`);
  }
  const wrong = mustNotMatch.filter((r) => rewriteRes.some((re) => re.test(r)));
  if (wrong.length) fail(`firebase.json rewrites must not serve these URLs (admin is never prefixed; unknown pages are 404):\n  ${wrong.join("\n  ")}`);
  console.log(`[prerender] firebase.json covers all ${expanded.length} app routes (x ${CODES.length} languages); /admin never prefixed`);
}

// The NotFound page, baked into dist/404.html.
async function render404(browser) {
  const page = await browser.newPage();
  try {
    await page.goto(ORIGIN + "/__prerender-404-check", { waitUntil: "networkidle2", timeout: 30000 });
    await page.waitForFunction(
      (t) => document.title === t && document.querySelector('meta[name="robots"][content*="noindex"]'),
      { timeout: 15000, polling: 100 },
      NOT_FOUND_TITLE
    );
    await new Promise((r) => setTimeout(r, 400));
    await writeFile(join(DIST, "404.html"), (await page.content()).replace(/ data-i18n="[^"]*"/, ""), "utf8");
    console.log("[prerender] 404 page -> dist/404.html");
  } finally {
    await page.close();
  }
}

function outFile(url) {
  if (url === "/") return join(DIST, "index.html");
  return join(DIST, url.replace(/^\//, ""), "index.html");
}

// Article URLs linked from the rendered /news page, plus every published post
// (the list the page loaded and cached, newest first — for the redirect pages).
async function newsRoutes(browser) {
  const page = await browser.newPage();
  try {
    await page.goto(ORIGIN + "/news", { waitUntil: "networkidle2", timeout: 30000 });
    await page.waitForSelector('a[href^="/news/"]', { timeout: 15000, polling: 100 });
    const hrefs = await page.$$eval('a[href^="/news/"]', (as) => as.map((a) => a.getAttribute("href")));
    const posts = await page.evaluate(() => JSON.parse(localStorage.getItem("cms:news:v1") || "[]"));
    return { routes: [...new Set(hrefs.filter((h) => /^\/news\/[^/?#]+$/.test(h)))], posts };
  } catch (e) {
    console.warn(`[prerender] could not list news articles: ${e.message}`);
    return { routes: [], posts: [] };
  } finally {
    await page.close();
  }
}

const escapeHtml = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

// Old article URLs (/news/<id>, /<lang>/news/<id>) -> the slug URL in the same
// language. Firebase Hosting serves these static files before the /news/*
// rewrite. An instant meta refresh is treated by Google as a permanent
// redirect; the canonical names the article's canonical URL, and the script
// keeps the query and hash for visitors.
async function writeNewsRedirects(posts, en, out) {
  const slugs = newsSlugMap(posts);
  let n = 0;
  for (const post of posts) {
    const slug = slugs.get(post.id);
    if (!slug || slug === post.id) continue;
    const route = `/news/${slug}`;
    const langs = en.get(route)?.langs;
    for (const code of CODES) {
      const from = localePath(code, `/news/${post.id}`);
      if (out.has(from)) fail(`${from} is both an article page and an old-URL redirect`);
      const to = localePath(code, route);
      const canonical = SITE_URL + localePath(!langs || langs.includes(code) ? code : "EN", route);
      const html = `<!doctype html>
<html lang="${langMeta(code).html}">
<head>
<meta charset="utf-8">
<title>${escapeHtml(post.title || "News")} | Dundul Raptenling Monastery</title>
<meta name="robots" content="noindex">
<link rel="canonical" href="${escapeHtml(canonical)}">
<meta http-equiv="refresh" content="0; url=${escapeHtml(to)}">
<script>location.replace(${JSON.stringify(to)} + location.search + location.hash);</script>
</head>
<body><p>This article has moved to <a href="${escapeHtml(to)}">${escapeHtml(SITE_URL + to)}</a>.</p></body>
</html>
`;
      const file = outFile(from);
      await mkdir(dirname(file), { recursive: true });
      await writeFile(file, html, "utf8");
      n++;
    }
  }
  console.log(`[prerender] ${n} old /news/<id> URLs -> redirect pages to /news/<slug>`);
}

// entries: [{ path, langs }] — English canonical path + languages it exists in.
// Each language URL is its own <url> with xhtml:link alternates (incl.
// x-default) and inherits the English page's priority.
async function writeSitemap(entries) {
  const priorities = {};
  try {
    const src = await readFile(resolve(__dirname, "../public/sitemap.xml"), "utf8");
    for (const m of src.matchAll(/<loc>([^<]+)<\/loc><priority>([^<]+)<\/priority>/g)) priorities[m[1]] = m[2];
  } catch { /* no hand-written sitemap: default priorities */ }
  const urls = [];
  for (const { path, langs } of entries) {
    const priority = priorities[SITE_URL + path] || "0.6";
    const links = alternates(path, langs)
      .map((a) => `    <xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${a.href}"/>`)
      .join("\n");
    for (const code of langs) {
      urls.push(`  <url>\n    <loc>${SITE_URL + localePath(code, path)}</loc>\n${links}\n    <priority>${priority}</priority>\n  </url>`);
    }
  }
  await writeFile(
    join(DIST, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join("\n")}\n</urlset>\n`,
    "utf8"
  );
  console.log(`[prerender] sitemap.xml: ${urls.length} URLs (${entries.length} pages x languages)`);
}

// Run fn over items, `n` at a time.
async function pool(items, n, fn) {
  let i = 0;
  await Promise.all(Array.from({ length: n }, async () => {
    while (i < items.length) await fn(items[i++]);
  }));
}

// Load one page in one language and capture its HTML plus what the guards need.
async function renderPage(browser, route, code) {
  const url = localePath(code, route);
  const page = await browser.newPage();
  try {
    let step = "load";
    try {
      await page.goto(ORIGIN + url, { waitUntil: "networkidle2", timeout: 30000 });
      // Wait for the app to mount and <Seo/> to update the head.
      step = "mount";
      await page.waitForFunction(
        () => document.querySelector("#root")?.children.length > 0,
        { timeout: 15000, polling: 100 }
      );
      // Articles load from Firestore after mount.
      step = "content";
      await page.waitForFunction(
        () => !document.querySelector("main")?.innerText.includes("Loading…"),
        { timeout: 15000, polling: 100 }
      );
      // Translation applied and the DOM quiet (set by LanguageProvider).
      step = "translation";
      await page.waitForFunction((c) => document.documentElement.dataset.i18n === c, { timeout: 30000, polling: 100 }, code);
    } catch (e) {
      throw new Error(`${step}: ${e.message}`);
    }
    await new Promise((r) => setTimeout(r, 400));
    const info = await page.evaluate(() => {
      const texts = [];
      const walker = document.createTreeWalker(document.getElementById("root"), NodeFilter.SHOW_TEXT, {
        acceptNode(n) {
          const p = n.parentElement;
          if (!p || ["SCRIPT", "STYLE", "NOSCRIPT"].includes(p.tagName) || p.closest("[data-no-translate]")) return NodeFilter.FILTER_REJECT;
          if (p.closest(".material-symbols-outlined")) return NodeFilter.FILTER_REJECT; // icon names
          return /\p{L}/u.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        },
      });
      let n;
      while ((n = walker.nextNode())) texts.push(n.nodeValue.replace(/\s+/g, " ").trim());
      return {
        noindex: !!document.querySelector('meta[name="robots"][content*="noindex"]'),
        canonical: document.querySelector('link[rel="canonical"]')?.getAttribute("href"),
        lang: document.documentElement.getAttribute("lang"),
        hreflang: [...document.querySelectorAll('link[rel="alternate"][hreflang]')].map((l) => [l.getAttribute("hreflang"), l.getAttribute("href")]),
        jsonld: [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => s.textContent.trim()),
        texts,
      };
    });
    // Snapshots must not carry the runtime marker.
    const html = (await page.content()).replace(/ data-i18n="[^"]*"/, "");
    return { url, html, ...info };
  } finally {
    await page.close();
  }
}

// Share of a page's visible text (by characters) still identical to English.
function englishShare(texts, enTexts) {
  let total = 0;
  let same = 0;
  for (const t of texts) {
    total += t.length;
    if (enTexts.has(t)) same += t.length;
  }
  return total ? same / total : 0;
}

function waitForServer(url, tries = 60) {
  return new Promise((res, rej) => {
    const tick = async (n) => {
      try {
        const r = await fetch(url);
        if (r.ok) return res();
      } catch { /* not up yet */ }
      if (n <= 0) return rej(new Error("preview server did not start"));
      setTimeout(() => tick(n - 1), 500);
    };
    tick(tries);
  });
}

async function main() {
  await checkHostingRoutes();

  if (process.env.SKIP_PRERENDER === "1") {
    console.warn(
      "[prerender] SKIP_PRERENDER=1 — prerender skipped. This build has NO per-page meta and NO 404.html:\n" +
      "            fine for local dev, NEVER deploy it."
    );
    return;
  }

  const chrome = await findChrome();
  if (!chrome) {
    fail(
      "No Chrome/Chromium/Edge found, so pages can't be prerendered and every page would lose its title/meta.\n" +
      "  Install Google Chrome, or set PUPPETEER_EXECUTABLE_PATH=/path/to/chrome.\n" +
      "  (Local dev only: SKIP_PRERENDER=1 npm run build — never deploy that build.)"
    );
  }

  const preview = spawn(
    "npx",
    ["vite", "preview", "--port", String(PORT), "--strictPort"],
    { cwd: resolve(__dirname, ".."), stdio: "ignore" }
  );

  let browser;
  try {
    await waitForServer(ORIGIN);
    try {
      browser = await puppeteer.launch({
        executablePath: chrome,
        headless: true,
        // Several pages render at once: keep background tabs at full speed.
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-background-timer-throttling",
          "--disable-renderer-backgrounding", "--disable-backgrounding-occluded-windows"],
      });
    } catch (e) {
      fail(`Chrome at "${chrome}" could not be launched: ${e.message}\n  Pages can't be prerendered — fix Chrome (or PUPPETEER_EXECUTABLE_PATH) and rebuild.`);
    }

    const required = new Set(routes()); // static pages + masters must render in every language
    const failed = [];
    const guardErrors = [];
    const out = new Map(); // url -> html (written once everything has rendered)
    const en = new Map(); // route -> English render info
    const news = await newsRoutes(browser);
    const list = [...routes(), ...news.routes];
    const htmlToCode = Object.fromEntries(LANGUAGES.map((l) => [l.html, l.code]));

    const render = async (route, code) => {
      const label = localePath(code, route);
      try {
        const r = await renderPage(browser, route, code);
        if (r.noindex) {
          console.warn(`[prerender] skipped ${label}: page is noindex (not found?)`);
          if (required.has(route)) failed.push(label);
          return null;
        }
        out.set(r.url, r.html);
        return r;
      } catch (e) {
        console.warn(`[prerender] FAILED ${label}: ${e.message}`);
        if (required.has(route)) failed.push(label);
        return null;
      }
    };

    // 1) English first: it is the reference for the guards and the coverage report.
    await pool(list, POOL, async (route) => {
      const r = await render(route, "EN");
      if (!r) return;
      // Languages the page exists in (news: English + translated languages),
      // and its canonical path (masters listed twice point at /presidents/).
      const langs = r.hreflang.map(([h]) => htmlToCode[h]).filter(Boolean);
      const path = (r.canonical || "").startsWith(SITE_URL) ? r.canonical.slice(SITE_URL.length) || "/" : route;
      en.set(route, { ...r, langs, path, enTexts: new Set(r.texts) });
      const want = route.startsWith("/news/") ? langs.length + 1 : CODES.length + 1;
      if (r.lang !== "en") guardErrors.push(`${route}: <html lang="${r.lang}">, expected "en"`);
      if (r.hreflang.length !== want) guardErrors.push(`${route}: ${r.hreflang.length} hreflang links, expected ${want}`);
    });

    // 2) Every other language, checked against English.
    const coverage = []; // { lang, route, share }
    const tasks = [];
    for (const code of OTHER) for (const route of list) if (en.has(route)) tasks.push([route, code]);
    const okByRoute = new Map(); // route -> Set(codes rendered with a self canonical)
    await pool(tasks, POOL, async ([route, code]) => {
      const r = await render(route, code);
      if (!r) return;
      const base = en.get(route);
      const label = r.url;
      const expectedLangs = route.startsWith("/news/") ? base.langs : CODES;
      const canonicalLang = expectedLangs.includes(code) ? code : "EN";
      const wantCanonical = SITE_URL + localePath(canonicalLang, base.path);
      const wantAlt = alternates(base.path, expectedLangs).map((a) => `${a.hreflang} ${a.href}`).sort().join("\n");
      const gotAlt = r.hreflang.map(([h, href]) => `${h} ${href}`).sort().join("\n");
      const errs = [];
      if (r.lang !== langMeta(code).html) errs.push(`<html lang="${r.lang}">, expected "${langMeta(code).html}"`);
      if (r.canonical !== wantCanonical) errs.push(`canonical ${r.canonical}, expected ${wantCanonical}`);
      if (r.hreflang.length !== expectedLangs.length + 1) errs.push(`${r.hreflang.length} hreflang links, expected ${expectedLangs.length + 1}`);
      else if (gotAlt !== wantAlt) errs.push(`hreflang links differ from the expected set`);
      if (r.jsonld.join("\n") !== base.jsonld.join("\n")) errs.push("JSON-LD differs from the English page");
      if (errs.length) guardErrors.push(`${label}: ${errs.join("; ")}`);
      if (canonicalLang === code) {
        if (!okByRoute.has(route)) okByRoute.set(route, new Set());
        okByRoute.get(route).add(code);
      }
      coverage.push({ code, route, share: englishShare(r.texts, base.enTexts), fallback: canonicalLang !== code });
    });

    // Coverage report.
    console.log("\n[prerender] translation coverage (share of visible text still identical to English):");
    for (const code of OTHER) {
      const rows = coverage.filter((c) => c.code === code);
      if (!rows.length) continue;
      const avg = rows.reduce((a, c) => a + c.share, 0) / rows.length;
      const high = rows.filter((c) => c.share > COVERAGE_WARN).sort((a, b) => b.share - a.share);
      console.log(`  ${PATH[code].padEnd(5)} ${rows.length} pages, average ${(avg * 100).toFixed(0)}% English, ${high.length} above ${COVERAGE_WARN * 100}%`);
      for (const c of high) {
        const why = c.fallback ? " (article not translated: English fallback, canonical = English)" : "";
        console.warn(`    WARN ${localePath(code, c.route)}: ${(c.share * 100).toFixed(0)}% English${why}`);
      }
    }

    console.log(`\n[prerender] done: ${out.size}/${list.length * CODES.length} pages`);
    if (failed.length) fail(`these pages failed to prerender (they would ship without meta):\n  ${failed.join("\n  ")}`);
    if (guardErrors.length) fail(`language pages failed their checks:\n  ${guardErrors.join("\n  ")}`);

    for (const [url, html] of out) {
      const file = outFile(url);
      await mkdir(dirname(file), { recursive: true });
      await writeFile(file, html, "utf8");
    }
    console.log(`[prerender] wrote ${out.size} pages to dist/`);
    await writeNewsRedirects(news.posts, en, out);
    await render404(browser);

    // Sitemap: English pages whose canonical is themselves, with the languages
    // that rendered with a self canonical.
    const sitemap = [];
    for (const route of list) {
      const r = en.get(route);
      if (!r || r.canonical !== SITE_URL + route) continue;
      const langs = CODES.filter((c) => c === "EN" || okByRoute.get(route)?.has(c));
      sitemap.push({ path: route, langs });
    }
    await writeSitemap(sitemap);
  } finally {
    if (browser) await browser.close();
    preview.kill("SIGTERM");
  }
}

main().catch((e) => {
  if (e instanceof PrerenderError) console.error(`\n[prerender] ERROR: ${e.message}\n`);
  else console.error("[prerender] error:", e);
  process.exit(1);
});
