import { Link } from "react-router-dom";
import PageBanner from "../components/PageBanner.jsx";
import ZeffyEmbed from "../components/ZeffyEmbed.jsx";
import { PujaCard, fmt } from "../components/PujaItemCard.jsx";
import { PUJA_LIST, PUJA_PAGES, BUTTER_LAMP, INR_PER_USD, RATE_NOTE, VLF_NOTE, VLF_NOTE_LAMPS } from "../data/pujaList.js";
import { useLang } from "../lib/i18n.jsx";

const BANNER = "https://res.cloudinary.com/dvhwombxw/image/upload/f_auto,q_auto/v1782520072/monastery/wocwwpny7tf75yv8zfx9.jpg";

const PUJA_STEPS = [
  { icon: "ti-check", title: "Choose a puja", text: "Pick the puja from the list on this page, or let us know your situation and the monks will suggest one." },
  { icon: "ti-heart", title: "Make your offering", text: "Use the secure form below. Add the name(s) the prayers are for and your intention." },
  { icon: "ti-candle", title: "The monks perform the puja", text: "The puja is performed at Dundul Raptenling Monastery in Odisha and dedicated to the names and intention you sent." },
];

const LAMP_STEPS = [
  { icon: "ti-check", title: "Choose how many lamps", text: "Offer 1, 21, 108 or 1,000 butter lamps, at US$1 per lamp." },
  { icon: "ti-heart", title: "Make your offering", text: "Use the secure form below. Add the name(s) the lamps are for and your intention." },
  { icon: "ti-flame", title: "The lamps are lit", text: "The monks light the butter lamps before the sacred images of the monastery and dedicate them to the names and intention you sent." },
];

// One offering page at /puja/<slug>: a puja purpose (its pujas from PUJA_LIST)
// or the butter lamp offering, then the Zeffy form for that offering.
export default function PujaCategory({ slug }) {
  const { lang } = useLang();
  const page = PUJA_PAGES.find((p) => p.slug === slug);
  const isLamp = page === BUTTER_LAMP;
  const items = isLamp ? [] : PUJA_LIST.filter((x) => x.cat === page.cat);
  const others = PUJA_PAGES.filter((p) => p !== page);
  const steps = isLamp ? LAMP_STEPS : PUJA_STEPS;

  return (
    <div className="page-puja">
      <style>{`.page-puja h1, .page-puja h2, .page-puja h3, .page-puja h4 { font-family: 'Noto Serif', serif; }`}</style>
      <PageBanner
        image={BANNER}
        eyebrow={isLamp ? "Light Offering" : "Puja Request"}
        title={page.title}
        trail={[{ label: "Home", to: "/" }, { label: "Puja Request", to: "/puja" }, { label: page.title }]}
      />

      {/* Intro */}
      <section className="py-14 sm:py-16 bg-white border-b border-outline-variant">
        <div className="max-w-[800px] mx-auto px-base sm:px-lg text-center">
          <i className={`ti ${page.icon} text-gold text-4xl mb-4 inline-block`}></i>
          <p className="text-base sm:text-lg text-ink-mid leading-relaxed mb-8">{page.desc}</p>
          <a href="#offer" className="inline-block bg-gold hover:bg-gold-dark text-white text-[14px] px-8 sm:px-12 py-4 transition-all shadow-lg rounded-[4px] uppercase tracking-[0.15em] font-medium">
            {isLamp ? "Offer Butter Lamps" : "Request this Puja"}
          </a>
        </div>
      </section>

      {/* Offering form */}
      <section id="offer" className="py-14 sm:py-20 bg-cream border-y border-outline-variant scroll-mt-28">
        <div className="max-w-[760px] mx-auto px-base sm:px-lg">
          <div className="text-center mb-8">
            <span className="text-[11px] text-gold-dark tracking-widest uppercase mb-2 block">Secure online offering</span>
            <h2 className="text-2xl sm:text-3xl text-ink font-normal">{isLamp ? "Offer Butter Lamps" : "Make Your Puja Offering"}</h2>
            <div className="h-[1px] w-16 bg-gold mx-auto mt-4"></div>
          </div>
          <div className="flex items-start gap-3 bg-white border border-gold/30 rounded-lg px-4 py-3 mb-6">
            <i className="ti ti-shield text-gold-dark text-xl"></i>
            <p className="text-[13px] text-ink-mid leading-relaxed">{isLamp ? VLF_NOTE_LAMPS : VLF_NOTE}</p>
          </div>
          {page.zeffy ? (
            <ZeffyEmbed form={page.zeffy} />
          ) : (
            <div className="bg-white rounded-lg border border-gold/30 p-6 sm:p-8 text-center">
              <i className="ti ti-heart text-gold text-3xl mb-3 inline-block"></i>
              <p className="text-ink-mid leading-relaxed mb-6">
                The online offering form for this page is coming soon. Until then, please send your request with the form on the puja page, and the monastery will reply by email with how to make your offering.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link to="/puja#puja-request" className="inline-flex items-center gap-2 bg-maroon text-white px-6 py-3 rounded-[4px] text-[12px] uppercase tracking-[0.15em] font-medium hover:bg-maroon-dark">
                  Puja Request Form <i className="ti ti-arrow-right"></i>
                </Link>
                <Link to="/offering" className="inline-flex items-center gap-2 border border-maroon text-maroon px-6 py-3 rounded-[4px] text-[12px] uppercase tracking-[0.15em] font-medium hover:bg-cream">
                  Other ways to give
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Butter lamp options, or the pujas in this category */}
      <section className="py-14 sm:py-20 bg-white">
        <div className="max-w-max-width mx-auto px-base sm:px-lg">
          {isLamp ? (
            <>
              <div className="text-center mb-10">
                <span className="text-[11px] text-gold-dark tracking-widest uppercase mb-2 block">Offering options</span>
                <h2 className="text-2xl sm:text-3xl text-ink font-normal">How many lamps would you like to offer?</h2>
                <div className="h-[1px] w-16 bg-gold mx-auto mt-4"></div>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                {BUTTER_LAMP.options.map((n) => {
                  const dollars = n * BUTTER_LAMP.usdPerLamp;
                  return (
                    <div key={n} className="p-6 rounded-lg border border-outline-variant bg-white text-center flex flex-col">
                      <i className="ti ti-flame text-gold text-3xl mb-2"></i>
                      <div className="text-3xl text-maroon font-serif">{n.toLocaleString("en-US")}</div>
                      <div className="text-[12px] text-ink-light uppercase tracking-wider mb-4">{n === 1 ? "butter lamp" : "butter lamps"}</div>
                      <div className="mt-auto text-xl text-gold-dark font-semibold">${dollars.toLocaleString("en-US")}</div>
                      <div className="text-[13px] text-ink-light">≈ ₹{fmt(Math.round(dollars * INR_PER_USD))}</div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              <div className="text-center mb-10">
                <span className="text-[11px] text-gold-dark tracking-widest uppercase mb-2 block">{items.length} pujas</span>
                <h2 className="text-2xl sm:text-3xl text-ink font-normal">{page.listTitle}</h2>
                <div className="h-[1px] w-16 bg-gold mx-auto mt-4"></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((p) => PujaCard(p, lang !== "TIB"))}
              </div>
              <p className="text-[12px] text-ink-light italic text-center mt-6 max-w-2xl mx-auto">
                The listed amounts are suggested offerings and help cover food, ritual materials, and support for the monks conducting the puja.
              </p>
            </>
          )}
          <p className="text-[12px] text-ink-light italic text-center mt-3 max-w-2xl mx-auto">{RATE_NOTE}</p>
        </div>
      </section>

      {/* How it works */}
      <section className="py-14 sm:py-16 bg-cream border-t border-outline-variant">
        <div className="max-w-max-width mx-auto px-base sm:px-lg">
          <div className="text-center mb-10">
            <span className="text-[11px] text-gold-dark tracking-widest uppercase mb-2 block">How it works</span>
            <div className="h-[1px] w-16 bg-gold mx-auto mt-2"></div>
          </div>
          <ol className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((s, i) => (
              <li key={s.title} className="p-6 rounded-lg border border-outline-variant bg-cream">
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-8 h-8 rounded-full bg-maroon text-white grid place-items-center text-[14px]">{i + 1}</span>
                  <i className={`ti ${s.icon} text-gold text-2xl`}></i>
                </div>
                <h3 className="text-lg text-maroon mb-2">{s.title}</h3>
                <p className="text-[14px] text-ink-mid leading-relaxed">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Other offerings */}
      <section className="py-14 sm:py-16 bg-white">
        <div className="max-w-max-width mx-auto px-base sm:px-lg">
          <div className="text-center mb-8">
            <span className="text-[11px] text-gold-dark tracking-widest uppercase mb-2 block">More offerings</span>
            <div className="h-[1px] w-16 bg-gold mx-auto mt-2"></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {others.map((p) => (
              <Link key={p.slug} to={`/puja/${p.slug}`} className="group p-5 rounded-lg border border-outline-variant bg-cream flex items-center gap-3 hover:border-gold/50 hover:shadow-sm transition-all">
                <i className={`ti ${p.icon} text-gold text-2xl`}></i>
                <span className="text-[15px] text-maroon group-hover:text-gold-dark">{p.title}</span>
              </Link>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link to="/puja" className="inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.15em] text-maroon hover:text-gold-dark">
              See the full puja list <i className="ti ti-arrow-right"></i>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
