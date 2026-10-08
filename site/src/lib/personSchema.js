// Person structured data (schema.org) for biography pages, so search engines can tell who
// a page is about. English only and the same in every language (the prerender checks that
// JSON-LD is identical across languages). Added to <head> while the page is shown.
import { useEffect } from "react";

const SITE = "https://dundulraptenling.org";
export const MONASTERY = { "@type": "PlaceOfWorship", name: "Dundul Raptenling Monastery", url: SITE + "/" };

export function usePersonSchema(data) {
  const json = data ? JSON.stringify({ "@context": "https://schema.org", "@type": "Person", ...data }) : "";
  useEffect(() => {
    if (!json) return undefined;
    const el = document.createElement("script");
    el.type = "application/ld+json";
    el.textContent = json;
    document.head.appendChild(el);
    return () => el.remove();
  }, [json]);
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

export function masterPerson(master) {
  const path = master.groups.includes("president") ? "/presidents/" : "/vajra-masters/";
  return {
    name: master.name,
    url: SITE + path + master.slug,
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
  sameAs: ["https://www.wikidata.org/wiki/Q1688950", "https://en.wikipedia.org/wiki/Dudjom_Jigdral_Yeshe_Dorje"],
};
