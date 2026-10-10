// Profile-page structured data (schema.org ProfilePage whose mainEntity is the
// Person) for biography pages, so search engines can tell who a page is about.
// https://developers.google.com/search/docs/appearance/structured-data/profile-page
// The Person facts are English and the same in every language; the ProfilePage
// carries the page's own canonical URL and language (the prerender checks both).
// Added to <head> while the page is shown (see jsonLd.js).
import { useJsonLd, canonicalUrl, inLanguage } from "./jsonLd.js";

const SITE = "https://dundulraptenling.org";
export const MONASTERY = {
  "@type": "PlaceOfWorship",
  name: "Dundul Raptenling Monastery",
  url: SITE + "/",
  sameAs: ["https://www.wikidata.org/wiki/Q141677199"],
};

// One ProfilePage per biography page. `path` = the page's unprefixed canonical
// path, `lang` = the page language (every biography exists in all languages).
// No dateCreated/dateModified: the biographies have no real dates.
export function useProfileSchema(person, { path, lang }) {
  useJsonLd(
    "profile",
    person
      ? {
          "@type": "ProfilePage",
          url: canonicalUrl(lang, path),
          inLanguage: inLanguage(lang),
          mainEntity: { "@type": "Person", ...person },
        }
      : null
  );
}

// Extra facts for individual masters, keyed by slug.
const EXTRA = {
  "lama-sonam-tashi-rinpoche": {
    jobTitle: "President of Dundul Raptenling Monastery",
    birthDate: "1987-08-11",
    memberOf: { "@type": "Organization", name: "Vajra Lotus Foundation", url: "https://vajralotusfoundation.org/" },
    sameAs: ["https://vajralotusfoundation.org/leadership"],
  },
};

// Unprefixed canonical path of a master's biography (people listed as both a
// President and a Vajra Master: the /presidents/ page).
export const masterPath = (master) =>
  (master.groups.includes("president") ? "/presidents/" : "/vajra-masters/") + master.slug;

export function masterPerson(master) {
  return {
    name: master.name,
    url: SITE + masterPath(master),
    image: master.portrait,
    description: `${master.role}, Dundul Raptenling Monastery`,
    affiliation: MONASTERY,
    ...(EXTRA[master.slug] || {}),
  };
}

export const DUDJOM_RINPOCHE = {
  name: "Dudjom Jigdral Yeshe Dorje",
  alternateName: ["Dudjom Rinpoche", "Kyabje Dudjom Rinpoche", "Jigdral Yeshe Dorje"],
  url: SITE + "/dudjom-rinpoche",
  birthDate: "1904-06-10",
  deathDate: "1987-01-17",
  description: "Supreme Head of the Nyingma tradition and founder of Dundul Raptenling Monastery in Odisha, India.",
  image: "https://res.cloudinary.com/dvhwombxw/image/upload/f_auto,q_auto,c_limit,w_1200/v1782636915/monastery/ocycrekbhfbnd2utdqin.jpg",
  sameAs: ["https://www.wikidata.org/wiki/Q1688950", "https://en.wikipedia.org/wiki/Dudjom_Jigdral_Yeshe_Dorje"],
};
