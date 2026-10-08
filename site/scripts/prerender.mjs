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
// Also prerenders every news article linked from /news (content from Firestore)
// and writes dist/sitemap.xml from the pages that rendered, keeping the
// priorities from public/sitemap.xml. Pages whose canonical URL points elsewhere
// (people listed under both /presidents and /vajra-masters) or that are
// noindex are left out of the sitemap.

import { spawn } from "node:child_process";
import { mkdir, writeFile, readFile, access } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

import { PAGE_SEO, SITE_URL } from "../src/lib/seo.js";
import { NOT_FOUND_TITLE } from "../src/lib/notFound.js";
import { MASTERS } from "../src/data/masters.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(__dirname, "../dist");
const PORT = 4183;
const ORIGIN = `http://localhost:${PORT}`;

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
  const sources = [...rewrites, ...redirects].map((r) => {
    if (r.regex) return new RegExp(r.regex);
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
  expanded.push("/admin/news", "/admin/news/new", "/admin/news/sample-id");
  const missing = expanded.filter((r) => r !== "/" && !sources.some((re) => re.test(r)));
  if (missing.length) {
    fail(`firebase.json has no rewrite for these app routes (they would answer 404):\n  ${missing.join("\n  ")}\n` +
      `Add a { "source": ..., "destination": "/index.html" } rewrite for each.`);
  }
  console.log(`[prerender] firebase.json covers all ${expanded.length} app routes`);
}

// The NotFound page, baked into dist/404.html.
async function render404(browser) {
  const page = await browser.newPage();
  try {
    await page.goto(ORIGIN + "/__prerender-404-check", { waitUntil: "networkidle2", timeout: 30000 });
    await page.waitForFunction(
      (t) => document.title === t && document.querySelector('meta[name="robots"][content*="noindex"]'),
      { timeout: 15000 },
      NOT_FOUND_TITLE
    );
    await new Promise((r) => setTimeout(r, 400));
    await writeFile(join(DIST, "404.html"), await page.content(), "utf8");
    console.log("[prerender] 404 page -> dist/404.html");
  } finally {
    await page.close();
  }
}

function outFile(route) {
  if (route === "/") return join(DIST, "index.html");
  return join(DIST, route.replace(/^\//, ""), "index.html");
}

// Article URLs linked from the rendered /news page.
async function newsRoutes(browser) {
  const page = await browser.newPage();
  try {
    await page.goto(ORIGIN + "/news", { waitUntil: "networkidle2", timeout: 30000 });
    await page.waitForSelector('a[href^="/news/"]', { timeout: 15000 });
    const hrefs = await page.$$eval('a[href^="/news/"]', (as) => as.map((a) => a.getAttribute("href")));
    return [...new Set(hrefs.filter((h) => /^\/news\/[^/?#]+$/.test(h)))];
  } catch (e) {
    console.warn(`[prerender] could not list news articles: ${e.message}`);
    return [];
  } finally {
    await page.close();
  }
}

async function writeSitemap(entries) {
  const priorities = {};
  try {
    const src = await readFile(resolve(__dirname, "../public/sitemap.xml"), "utf8");
    for (const m of src.matchAll(/<loc>([^<]+)<\/loc><priority>([^<]+)<\/priority>/g)) priorities[m[1]] = m[2];
  } catch { /* no hand-written sitemap: default priorities */ }
  const urls = entries
    .map((loc) => `  <url><loc>${loc}</loc><priority>${priorities[loc] || "0.6"}</priority></url>`)
    .join("\n");
  await writeFile(
    join(DIST, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    "utf8"
  );
  console.log(`[prerender] sitemap.xml: ${entries.length} URLs`);
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
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
    } catch (e) {
      fail(`Chrome at "${chrome}" could not be launched: ${e.message}\n  Pages can't be prerendered — fix Chrome (or PUPPETEER_EXECUTABLE_PATH) and rebuild.`);
    }

    const required = new Set(routes()); // static pages + masters must all render
    const failed = [];

    const list = [...routes(), ...(await newsRoutes(browser))];
    const sitemap = [];
    let ok = 0;
    for (const route of list) {
      const page = await browser.newPage();
      try {
        await page.goto(ORIGIN + route, { waitUntil: "networkidle2", timeout: 30000 });
        // Wait for the app to mount and <Seo/> to update the head.
        await page.waitForFunction(
          () => document.querySelector("#root")?.children.length > 0,
          { timeout: 15000 }
        );
        // Articles load from Firestore after mount.
        await page.waitForFunction(
          () => !document.querySelector("main")?.innerText.includes("Loading…"),
          { timeout: 15000 }
        );
        await new Promise((r) => setTimeout(r, 400));
        const { noindex, canonical } = await page.evaluate(() => ({
          noindex: !!document.querySelector('meta[name="robots"][content*="noindex"]'),
          canonical: document.querySelector('link[rel="canonical"]')?.getAttribute("href"),
        }));
        if (noindex) {
          console.warn(`[prerender] skipped ${route}: page is noindex (not found?)`);
          if (required.has(route)) failed.push(route);
          continue;
        }
        const loc = SITE_URL + route;
        if (canonical === loc) sitemap.push(loc);
        const html = await page.content();
        const file = outFile(route);
        await mkdir(dirname(file), { recursive: true });
        await writeFile(file, html, "utf8");
        ok++;
        console.log(`[prerender] ${route} -> ${file.replace(DIST, "dist")}`);
      } catch (e) {
        console.warn(`[prerender] FAILED ${route}: ${e.message}`);
        if (required.has(route)) failed.push(route);
      } finally {
        await page.close();
      }
    }
    console.log(`[prerender] done: ${ok}/${list.length} routes`);
    if (failed.length) fail(`these pages failed to prerender (they would ship without meta):\n  ${failed.join("\n  ")}`);
    await render404(browser);
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
