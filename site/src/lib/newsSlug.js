// Readable URLs for news posts: /news/<slug> instead of /news/<Firestore id>.
// Plain JS (no JSX, no import.meta.env) so scripts/prerender.mjs can import it.
//
// A post's slug is its stored `slug` field (set once by the admin form), else
// slugify(English title), else its ID (title without Latin letters). Old
// /news/<id> URLs keep working: prerender writes a redirect page for each, and
// NewsDetail replaces an ID in the URL with the slug.

const MAX = 75;

// "Ven. Lama Sonam Tashi visited…" -> "ven-lama-sonam-tashi-visited…".
// Lowercase ASCII + hyphens, diacritics stripped, at most 75 characters (cut
// at a hyphen). "" when nothing Latin is left.
export function slugify(text) {
  let s = String(text || "")
    .replace(/[đĐ]/g, "d")
    .replace(/[øØ]/g, "o")
    .replace(/[ßẞ]/g, "ss")
    .replace(/[æÆ]/g, "ae")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['’‘`]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (s.length > MAX) {
    s = s.slice(0, MAX + 1);
    const cut = s.lastIndexOf("-");
    s = (cut > 20 ? s.slice(0, cut) : s.slice(0, MAX)).replace(/-+$/, "");
  }
  return /[a-z]/.test(s) ? s : "";
}

// Slug a post would get on its own (no collision check).
export function baseSlug(post) {
  return slugify(post?.slug) || slugify(post?.title) || post?.id || "";
}

// id -> slug for a list of posts, newest first (the order the site and the
// admin load them in). Stored slugs are claimed first; when two posts would
// share a slug, the older one keeps it and the newer one gets "-<first 4 chars
// of its id>" — deterministic, so every page and the prerender agree.
export function newsSlugMap(posts = []) {
  const map = new Map();
  const taken = new Set();
  const oldestFirst = [...(posts || [])].filter((p) => p && p.id).reverse();
  const claim = (p, base) => {
    let s = base;
    if (taken.has(s)) s = `${base}-${p.id.slice(0, 4).toLowerCase()}`;
    for (let n = 2; taken.has(s); n++) s = `${base}-${p.id.slice(0, 4).toLowerCase()}-${n}`;
    taken.add(s);
    map.set(p.id, s);
  };
  for (const p of oldestFirst) if (slugify(p.slug)) claim(p, slugify(p.slug));
  for (const p of oldestFirst) if (!map.has(p.id)) claim(p, baseSlug(p));
  return map;
}

// "/news/<slug>" for a post in `posts` (falls back to its ID).
export function newsPath(post, posts) {
  const slug = newsSlugMap(posts).get(post.id) || post.id;
  return `/news/${slug}`;
}

// The post a /news/<param> URL points at: by slug first, then by ID (old
// links). Returns { post, slug, byId } or null.
export function findNews(posts, param) {
  const map = newsSlugMap(posts);
  for (const p of posts || []) if (map.get(p.id) === param) return { post: p, slug: param, byId: false };
  const p = (posts || []).find((x) => x.id === param);
  return p ? { post: p, slug: map.get(p.id), byId: map.get(p.id) !== param } : null;
}
