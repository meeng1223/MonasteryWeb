import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { getPublished, cachedItem } from "../lib/publicContent.js";
import { useLang, localized, articleLangs, t } from "../lib/i18n.jsx";
import { cld, newsCover } from "../lib/cloudinary.js";
import PageBanner from "../components/PageBanner.jsx";
import RichText from "../components/RichText.jsx";
import { applySeo, NoIndex } from "../components/Seo.jsx";
import { trimDescription } from "../lib/seo.js";
import { richTextToPlain } from "../lib/richtext.js";
import { useSisterLinks } from "../lib/sisterSites.js";

export default function NewsDetail() {
  const { id } = useParams();
  const { lang } = useLang();
  const sister = useSisterLinks();
  // undefined = loading, null = not found. Starts from the cached news list
  // (instant when the visitor came from /news or the homepage), then refreshes.
  const [doc, setDoc] = useState(() => cachedItem("news", id) || undefined);

  useEffect(() => {
    let alive = true;
    window.scrollTo(0, 0);
    setDoc(cachedItem("news", id) || undefined);
    getPublished("news", id)
      .then((d) => { if (alive) setDoc(d); })
      .catch(() => { if (alive) setDoc((prev) => prev || null); });
    return () => { alive = false; };
  }, [id]);

  // Languages this article exists in: English + every language whose title and
  // body are both translated. Other languages show the English article, with
  // the English URL as canonical and no hreflang entry of their own.
  const langs = doc ? articleLangs(doc) : [];
  const shown = langs.includes(lang) ? lang : "EN";

  // Article title/description/image for Google and link previews, in the
  // language shown.
  useEffect(() => {
    if (!doc) return;
    // (an English excerpt is not used for a translated article: its body is)
    const excerpt = localized(doc, "excerpt", shown);
    const ownExcerpt = shown === "EN" || excerpt !== localized(doc, "excerpt", "EN") ? excerpt : "";
    const text = richTextToPlain(ownExcerpt || localized(doc, "body", shown));
    applySeo({
      title: `${localized(doc, "title", shown)} | ${t("Dundul Raptenling Monastery", lang)}`,
      description: trimDescription(text.replace(/\s+/g, " ").trim()),
      path: `/news/${id}`,
      image: newsCover(doc, { fallback: false }) || undefined,
      lang,
      langs: articleLangs(doc),
      canonicalLang: shown,
      translate: false,
    });
  }, [doc, id, lang, shown]);

  if (doc === undefined) {
    return <div className="py-4xl text-center text-ink-light">Loading…</div>;
  }

  if (!doc) {
    return (
      <div className="py-4xl text-center">
        <NoIndex />
        <h1 className="font-section-heading text-section-heading text-maroon mb-base">Article not found</h1>
        <Link to="/news" className="text-maroon underline hover:text-gold">Back to News</Link>
      </div>
    );
  }

  const title = localized(doc, "title", shown);
  const date = localized(doc, "date", shown);
  const body = localized(doc, "body", shown) || localized(doc, "excerpt", shown);
  const images = Array.isArray(doc.images) ? doc.images.filter(Boolean).map(cld) : [];

  return (
    <div className="page-news-detail">
      <style>{`.page-news-detail h1,.page-news-detail h2,.page-news-detail h3{font-family:'Noto Serif',serif;}`}</style>

      <PageBanner
        image={newsCover(doc, { fallback: false })}
        eyebrow={doc.category || "News"}
        title={title}
        trail={[{ label: "Home", to: "/" }, { label: "News", to: "/news" }, { label: title }]}
      />

      <article className="max-w-3xl mx-auto px-base sm:px-lg py-4xl">
        {date && <p className="font-caption text-ink-light mb-lg">{date}</p>}

        {doc.category === "Zangdok Palri" && (
          <aside className="mb-xl border-l-2 border-gold bg-cream px-base py-3 font-body-md text-ink-mid">
            <span>Part of Zangdok Palri</span>
            {" · "}
            <a href={sister.register} target="_blank" rel="noreferrer" className="text-maroon underline hover:text-gold">
              <span>Register for the 2028 consecration</span> →
            </a>
            {" · "}
            <a href={sister.travel} target="_blank" rel="noreferrer" className="text-maroon underline hover:text-gold">
              <span>Plan your visit: transport, stay &amp; permits</span> →
            </a>
          </aside>
        )}

        <RichText
          value={body}
          className="font-body-md text-body-md text-ink-mid leading-relaxed [&>*+*]:!mt-4 [&_a]:text-maroon [&_a]:break-words [&_a:hover]:text-gold"
        />

        {images.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2xl">
            {images.map((src, i) => (
              <div key={i} className="aspect-square overflow-hidden rounded-lg bg-cream">
                <img loading="lazy" decoding="async" src={src} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}

        <div className="mt-3xl pt-xl border-t border-outline-variant/30">
          <Link to="/news" className="inline-flex items-center gap-2 font-button-text text-maroon hover:text-gold transition-colors uppercase">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span> Back to News
          </Link>
        </div>
      </article>
    </div>
  );
}
