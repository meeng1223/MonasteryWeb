// Public, read-only CMS content (news, magazine, publications, gallery, prayer
// books) for the website pages.
//
// Reads go through Firestore's REST API instead of the Firebase SDK: the SDK is
// several hundred KB and needs a slow first connection, while one REST call
// returns the whole collection. The collections are publicly readable
// (firestore.rules), so no sign-in is needed.
//
// Every successful read is kept in memory and in localStorage, so a page can
// render the last known content immediately (cachedPublished) and then refresh
// it in the background (listPublished / getPublished).
//
// The admin (/admin) keeps using the SDK in content.js.

const PROJECT = import.meta.env.VITE_FIREBASE_PROJECT_ID;
const API_KEY = import.meta.env.VITE_FIREBASE_API_KEY;
const DOCS = PROJECT
  ? `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`
  : null;

export const contentEnabled = Boolean(DOCS);

const CACHE_VERSION = 1;
const memory = {};
const storageKey = (coll) => `cms:${coll}:v${CACHE_VERSION}`;

// Firestore REST value → plain JS value (timestamps stay ISO strings; the
// public pages don't use them).
function decode(v) {
  if (!v || typeof v !== "object") return undefined;
  if ("stringValue" in v) return v.stringValue;
  if ("booleanValue" in v) return v.booleanValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return v.doubleValue;
  if ("timestampValue" in v) return v.timestampValue;
  if ("nullValue" in v) return null;
  if ("arrayValue" in v) return (v.arrayValue.values || []).map(decode);
  if ("mapValue" in v) return decodeFields(v.mapValue.fields);
  if ("referenceValue" in v) return v.referenceValue;
  if ("geoPointValue" in v) return v.geoPointValue;
  return undefined;
}

function decodeFields(fields = {}) {
  const out = {};
  for (const k in fields) out[k] = decode(fields[k]);
  return out;
}

const fromDocument = (d) => ({ id: d.name.split("/").pop(), ...decodeFields(d.fields) });

function remember(coll, items) {
  memory[coll] = items;
  try {
    localStorage.setItem(storageKey(coll), JSON.stringify(items));
  } catch {
    /* private mode / quota: memory cache still works */
  }
}

// Last known published items of a collection (newest first), or null if this
// browser has never loaded it. Synchronous, for a page's first render.
export function cachedPublished(coll) {
  if (memory[coll]) return memory[coll];
  try {
    const raw = localStorage.getItem(storageKey(coll));
    if (raw) return (memory[coll] = JSON.parse(raw));
  } catch {
    /* ignore a broken cache entry */
  }
  return null;
}

const inflight = {};

// Fresh published items, newest first. Returns null when the CMS isn't
// configured, has no documents, or can't be reached (pages then keep their
// built-in content or the cached copy).
export function listPublished(coll) {
  if (!DOCS) return Promise.resolve(null);
  if (inflight[coll]) return inflight[coll];
  const url = `${DOCS}:runQuery${API_KEY ? `?key=${API_KEY}` : ""}`;
  inflight[coll] = fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: coll }],
        orderBy: [{ field: { fieldPath: "createdAt" }, direction: "DESCENDING" }],
      },
    }),
  })
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then((rows) => {
      const items = rows
        .filter((row) => row.document)
        .map((row) => fromDocument(row.document))
        .filter((x) => x.published !== false);
      if (!items.length) return null;
      remember(coll, items);
      return items;
    })
    .catch((e) => {
      console.warn(`[content] could not read "${coll}":`, e?.message);
      return null;
    })
    .finally(() => {
      delete inflight[coll];
    });
  return inflight[coll];
}

// One published item, from the cache when available (instant), else null.
export function cachedItem(coll, id) {
  const list = cachedPublished(coll);
  return (list && list.find((x) => x.id === id)) || null;
}

// One item, fresh from the CMS. Resolves to null if it doesn't exist or isn't
// published; rejects on network errors.
export async function getPublished(coll, id) {
  if (!DOCS) return null;
  const r = await fetch(`${DOCS}/${coll}/${encodeURIComponent(id)}${API_KEY ? `?key=${API_KEY}` : ""}`);
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const item = fromDocument(await r.json());
  return item.published === false ? null : item;
}

// Public forms (contact, puja request, newsletter) write through the Firebase
// SDK, which is loaded only when a form is actually submitted.
export async function createItem(coll, data) {
  const { createItem: create } = await import("./content.js");
  return create(coll, data);
}
