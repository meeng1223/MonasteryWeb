import { Link } from "react-router-dom";
import PageBanner from "../components/PageBanner.jsx";
import { cldw } from "../lib/cloudinary.js";

const DONATION_URL = "https://www.zeffy.com/en-US/donation-form/help-shape-the-future-of-dharma-support-young-monks-at-dundul-raptenling-monastery";
const IMG_QUOTE = "https://res.cloudinary.com/dvhwombxw/image/upload/f_auto,q_auto/v1782520072/monastery/wocwwpny7tf75yv8zfx9.jpg";

// Data for the sections added above the existing giving instructions.
const IMG_STUDY = "https://res.cloudinary.com/dvhwombxw/image/upload/f_auto,q_auto/v1782520029/monastery/cfnjpj73wvlhbspfj4tp.jpg";

const NEEDS = [
  { icon: "temple_buddhist", title: "Limited infrastructure", text: "Dormitories and study spaces are stretched beyond capacity." },
  { icon: "restaurant", title: "Insufficient food and resources", text: "Rations for about 130 residents cost around US$2,508 every month." },
  { icon: "group", title: "More young monks needing support", text: "The number of children arriving at the monastery keeps growing." },
];

// Monthly ration requirements, from the monastery's November 2026 appeal.
// US$ at about ₹94.50 per US$1 (6 November 2026).
const RATIONS = [
  { item: "Rice", qty: "1,500 kg (30 bags)", inr: "₹40,500", usd: "≈ $429" },
  { item: "Cooking oil", qty: "30 tins", inr: "₹81,000", usd: "≈ $857" },
  { item: "Maida (refined flour)", qty: "1,500 kg (30 bags)", inr: "₹58,500", usd: "≈ $619" },
  { item: "Atta (wheat flour)", qty: "1,500 kg (30 bags)", inr: "₹57,000", usd: "≈ $603" },
];

const RATION_STATS = [
  { value: "≈ $19", label: "one person’s rations for a month" },
  { value: "≈ $84", label: "feeds the whole monastery for a day" },
  { value: "≈ $627", label: "feeds everyone for a week" },
];

const AIMS = [
  { icon: "restaurant", title: "Nourish", text: "Provide daily meals, clean water and a safe home for over 100 monks." },
  { icon: "temple_buddhist", title: "Build", text: "Renovate and expand dormitories, classrooms and study spaces." },
  { icon: "menu_book", title: "Educate", text: "Offer modern education, Dharma training and accessible healthcare." },
  { icon: "spa", title: "Sustain", text: "Build a sustainable monastic environment for the future." },
];

const TIMELINE = [
  { when: "2025–2026 · Construction phase", text: "Construction continues on the new building block — classrooms, a hostel, a library, and other key facilities." },
  { when: "2026 · Education & wellness plan", text: "Launched in 2026: a comprehensive education & wellness plan focused on academic and spiritual growth, emotional care, and physical well-being for every young monk." },
];

const TIERS = [
  { name: "Diamond Sponsor", amount: "$100 / month", year: "or $1,200 per year", text: "Nourish and house multiple monks every month." },
  { name: "Gold Sponsor", amount: "$50 / month", year: "or $600 per year", text: "Provide basic needs and school supplies." },
  { name: "Silver Sponsor", amount: "$25 / month", year: "or $300 per year", text: "Support meals, learning, and care for one monk — rations alone are about $19 a month." },
  { name: "One-time Donor", amount: "Any amount", year: "every offering counts", text: "Give once, in any amount, to support the monks today." },
];

function Eyebrow({ children }) {
  return <span className="block text-[11px] uppercase tracking-[0.2em] text-gold-dark font-semibold mb-3">{children}</span>;
}

function Row({ label, value, dark }) {
  return (
    <div className={`flex justify-between items-baseline gap-4 py-2 border-b last:border-0 ${dark ? "border-gold-light/15" : "border-outline-variant/30"}`}>
      <span className={`text-[10px] uppercase tracking-widest shrink-0 ${dark ? "text-gold-light/60" : "text-ink-light"}`}>{label}</span>
      <span className={`text-[14px] font-mono text-right break-all ${dark ? "text-gold-light" : "text-ink-mid"}`}>{value}</span>
    </div>
  );
}

export default function SupportYoungMonks() {
  return (
    <div className="page-support-young">
      <style>{`
        .page-support-young h1, .page-support-young h2, .page-support-young h3, .page-support-young h4, .page-support-young h5 { font-family: 'Noto Serif', serif; }
        .page-support-young .accent-bar { border-left: 3px solid #C49A2A; }
      `}</style>

      <PageBanner
        eyebrow="Support the Monastery"
        title="Support Young Monks"
        trail={[{ label: "Home", to: "/" }, { label: "Support", to: "/support" }, { label: "Support Young Monks" }]}
      />


      {/* Appeal */}
      <section className="py-14 sm:py-16 bg-white border-b border-outline-variant">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <Eyebrow>Nurturing the future of Dharma</Eyebrow>
          <h2 className="text-3xl sm:text-4xl text-maroon mb-4 leading-tight">Support young monks at Dundul Raptenling Monastery</h2>
          <p className="text-ink-mid leading-relaxed mb-8">Provide nourishment. Create a home. Educate future teachers. From $25 a month, you can care for a young monk in Odisha, India.</p>
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <a href="#how-to-give" className="inline-flex items-center gap-2 px-6 py-3 bg-maroon text-white rounded-lg text-[13px] uppercase tracking-widest font-medium hover:bg-maroon-dark transition-colors">
              <i className="ti ti-heart"></i> Become a sponsor
            </a>
            <a href="#rations" className="inline-flex items-center gap-2 px-6 py-3 border border-maroon text-maroon rounded-lg text-[13px] uppercase tracking-widest font-medium hover:bg-cream transition-colors">
              See this month’s ration needs
            </a>
          </div>
          <div className="flex items-start gap-3 text-left bg-cream border border-gold/30 rounded-lg px-4 py-3">
            <span className="material-symbols-outlined text-gold-dark">restaurant</span>
            <p className="text-[14px] text-ink-mid">November 2026 appeal: about US$2,508 covers one month of rice, oil and flour for the whole monastery.</p>
          </div>
        </div>
      </section>

      {/* Introduction */}
      <section className="py-14 sm:py-20 bg-cream">
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <Eyebrow>Introduction</Eyebrow>
            <h2 className="text-3xl text-maroon mb-5 leading-tight">A safe, caring home for 100+ monks</h2>
            <div className="space-y-4 text-ink-mid leading-relaxed">
              <p>Nestled in the sacred land of Odisha, India, Dundul Raptenling Monastery is home to over 100 monks — many of whom arrived as young as one to five years old.</p>
              <p>These monks, often from families with deep devotion to the Dharma, have been lovingly raised and guided by Lama Sonam Tashi Rinpoche, the monastery’s spiritual head.</p>
              <p>At Dundul Raptenling, these young monastics are not only offered a safe and caring home — they’re nourished physically, intellectually, and spiritually. They receive education, wholesome meals, medical care, and deep Dharma training to one day become compassionate teachers and torchbearers of the lineage.</p>
            </div>
            <Link to="/presidents/lama-sonam-tashi-rinpoche" className="inline-flex items-center gap-1 mt-5 text-maroon text-[14px] font-medium hover:underline">
              About Lama Sonam Tashi Rinpoche <i className="ti ti-arrow-right"></i>
            </Link>
          </div>
          <img className="w-full rounded-xl shadow-md object-cover aspect-[4/3]" src={cldw(IMG_STUDY, 900)} alt="A young monk writing an exam in a classroom at Dundul Raptenling" loading="lazy" decoding="async" />
        </div>
      </section>

      {/* The need */}
      <section className="py-14 sm:py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="max-w-2xl mb-10">
            <Eyebrow>The need</Eyebrow>
            <h2 className="text-3xl text-maroon mb-4 leading-tight">The monastery is facing urgent challenges</h2>
            <p className="text-ink-mid leading-relaxed">Despite these hardships, Lama Sonam Tashi Rinpoche has never turned away a child in need. But he cannot continue this sacred work alone.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {NEEDS.map((n) => (
              <div key={n.title} className="bg-cream rounded-xl border border-gold/20 p-6">
                <span className="material-symbols-outlined text-maroon text-3xl mb-3 block">{n.icon}</span>
                <h3 className="text-lg text-ink mb-2">{n.title}</h3>
                <p className="text-[14px] text-ink-mid leading-relaxed">{n.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Monthly rations */}
      <section id="rations" className="py-14 sm:py-20 bg-cream scroll-mt-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="max-w-2xl mb-10">
            <Eyebrow>Monthly ration needs · 2026</Eyebrow>
            <h2 className="text-3xl text-maroon mb-4 leading-tight">One month of meals for about 130 people</h2>
            <div className="space-y-4 text-ink-mid leading-relaxed">
              <p>Around 130 people live and eat at Dundul Raptenling every day — about 100 monks together with the staff who care for them.</p>
              <p>Each month the monastery’s kitchen needs four staples: rice, cooking oil and two kinds of flour. Together they cost about ₹2,37,000 — roughly US$2,508. Your gift helps cover these monthly ration expenses so no one goes without.</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-4 mb-10">
            {RATION_STATS.map((r) => (
              <div key={r.value} className="bg-white rounded-xl border border-gold/20 p-5 text-center">
                <div className="text-3xl text-maroon font-serif mb-1">{r.value}</div>
                <div className="text-[13px] text-ink-light">{r.label}</div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl border border-gold/20 overflow-hidden">
            <div className="px-5 sm:px-6 py-4 border-b border-gold/20 flex items-center gap-3">
              <span className="material-symbols-outlined text-maroon">restaurant</span>
              <div>
                <h3 className="text-lg text-ink">Monthly ration requirements</h3>
                <p className="text-[12px] text-ink-light">For one month · Odisha, 2026</p>
              </div>
            </div>
            <table className="w-full text-left text-[14px]">
              <thead className="bg-cream/60 text-[11px] uppercase tracking-widest text-ink-light">
                <tr>
                  <th className="px-5 sm:px-6 py-3 font-semibold">Item</th>
                  <th className="px-3 py-3 font-semibold">Quantity</th>
                  <th className="px-5 sm:px-6 py-3 font-semibold text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {RATIONS.map((r) => (
                  <tr key={r.item} className="border-t border-outline-variant/30">
                    <td className="px-5 sm:px-6 py-3 text-ink">{r.item}</td>
                    <td className="px-3 py-3 text-ink-mid">{r.qty}</td>
                    <td className="px-5 sm:px-6 py-3 text-right text-ink-mid whitespace-nowrap">{r.inr}<span className="block text-[12px] text-ink-light">{r.usd}</span></td>
                  </tr>
                ))}
                <tr className="border-t-2 border-gold/30 bg-cream/40">
                  <td className="px-5 sm:px-6 py-3 font-semibold text-ink" colSpan={2}>Total for one month</td>
                  <td className="px-5 sm:px-6 py-3 text-right font-semibold text-maroon whitespace-nowrap">₹2,37,000<span className="block text-[12px] font-normal text-ink-light">≈ US$2,508</span></td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-[12px] text-ink-light italic mt-3">US dollar amounts use about ₹94.50 per US$1 (6 November 2026); the actual amount may vary with exchange rates and fees.</p>
          <a href="#how-to-give" className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-maroon text-white rounded-lg text-[13px] uppercase tracking-widest font-medium hover:bg-maroon-dark transition-colors">
            <i className="ti ti-heart"></i> Help cover this month’s rations
          </a>
        </div>
      </section>

      {/* Purpose & vision */}
      <section className="py-14 sm:py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="max-w-2xl mb-10">
            <Eyebrow>Our purpose &amp; vision</Eyebrow>
            <h2 className="text-3xl text-maroon mb-4 leading-tight">With your help, we aim to…</h2>
            <p className="text-ink-mid leading-relaxed">This is more than support — it’s a seed for generational wisdom and compassionate leadership.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {AIMS.map((a) => (
              <div key={a.title} className="rounded-xl border border-gold/20 p-6">
                <span className="material-symbols-outlined text-gold-dark text-3xl mb-3 block">{a.icon}</span>
                <h3 className="text-xl text-maroon mb-2">{a.title}</h3>
                <p className="text-[14px] text-ink-mid leading-relaxed">{a.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Current project + timeline */}
      <section className="py-14 sm:py-20 bg-cream">
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-2 gap-10">
          <div>
            <Eyebrow>Current project</Eyebrow>
            <h2 className="text-3xl text-maroon mb-5 leading-tight">A new home for learning</h2>
            <div className="space-y-4 text-ink-mid leading-relaxed">
              <p>We’re raising funds to complete a new building block — currently under construction — that will include classrooms, a library, and hostel accommodations for the young monks.</p>
              <p>In addition to this one-time goal, we are seeking ongoing support to sustain daily living, education, and wellness needs for the monastic community.</p>
              <p>Your contributions ensure the monastery can continue to welcome and care for young monks, providing them with the foundation to thrive and serve as future Dharma teachers.</p>
            </div>
            <Link to="/hostel-project" className="inline-flex items-center gap-1 mt-5 text-maroon text-[14px] font-medium hover:underline">
              See the hostel &amp; classroom project <i className="ti ti-arrow-right"></i>
            </Link>
          </div>
          <div>
            <Eyebrow>Timeline &amp; project updates</Eyebrow>
            <ol className="space-y-5 mt-2">
              {TIMELINE.map((t) => (
                <li key={t.when} className="bg-white rounded-xl border border-gold/20 p-5 accent-bar">
                  <span className="inline-block text-[10px] uppercase tracking-widest bg-gold/15 text-gold-dark px-2 py-0.5 rounded mb-2">In progress</span>
                  <h3 className="text-lg text-ink mb-1">{t.when}</h3>
                  <p className="text-[14px] text-ink-mid leading-relaxed">{t.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Sponsor tiers */}
      <section id="sponsor" className="py-14 sm:py-20 bg-white scroll-mt-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="max-w-2xl mx-auto text-center mb-10">
            <Eyebrow>Join our circle of compassion</Eyebrow>
            <h2 className="text-3xl text-maroon mb-4 leading-tight">Help shape the future of Dharma</h2>
            <p className="text-ink-mid leading-relaxed">Whether you give once or become a monthly supporter, your offering plants a seed of hope, growth, and sacred continuity.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {TIERS.map((t, i) => (
              <div key={t.name} className={`rounded-xl border p-6 flex flex-col ${i === 0 ? "bg-maroon-dark text-gold-light border-maroon-dark" : "bg-cream border-gold/20"}`}>
                <h3 className={`text-[12px] uppercase tracking-widest font-semibold mb-3 ${i === 0 ? "text-gold" : "text-gold-dark"}`}>{t.name}</h3>
                <div className={`text-2xl font-serif ${i === 0 ? "text-white" : "text-maroon"}`}>{t.amount}</div>
                <div className={`text-[12px] mb-4 ${i === 0 ? "text-gold-light/70" : "text-ink-light"}`}>{t.year}</div>
                <p className={`text-[14px] leading-relaxed mb-6 flex-1 ${i === 0 ? "text-gold-light/90" : "text-ink-mid"}`}>{t.text}</p>
                <a href={DONATION_URL} target="_blank" rel="noreferrer" className={`text-center py-3 rounded-lg text-[12px] uppercase tracking-widest font-medium transition-colors ${i === 0 ? "bg-gold text-maroon-dark hover:bg-gold-dark" : "border border-maroon text-maroon hover:bg-white"}`}>
                  {i === 3 ? "Give once" : "Choose " + t.name.split(" ")[0]}
                </a>
              </div>
            ))}
          </div>
          <div className="flex items-start gap-3 bg-cream border border-gold/30 rounded-lg px-4 py-3 mt-8 max-w-3xl mx-auto">
            <i className="ti ti-heart-plus text-gold-dark text-xl"></i>
            <p className="text-[14px] text-ink-mid">A thank-you from the monastery. Long-term donors will receive curated Dharma gifts — such as incense, prayer items, and sacred offerings — aligned with your tier of giving.</p>
          </div>
          <p className="text-center text-[13px] text-ink-light mt-6">Other ways to give — bank transfer in India, UPI, PayPal, wire or check — are below.</p>
        </div>
      </section>

      {/* Tashi Delek */}
      <section id="how-to-give" className="py-16 bg-white border-b border-outline-variant scroll-mt-24">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <div className="w-12 h-12 bg-gold rounded-lg grid place-items-center mx-auto mb-6">
            <i className="ti ti-check text-white text-2xl"></i>
          </div>
          <h2 className="text-3xl sm:text-4xl text-maroon mb-4">Tashi Delek</h2>
          <p className="text-ink-mid leading-relaxed">
            Thank you for your generosity. If you wish to support the monastery, please follow the donation instructions below. Your support sustains our lineage and spiritual community.
          </p>
        </div>
      </section>

      {/* Instructions */}
      <section className="py-14 sm:py-16 bg-cream">
        <div className="max-w-3xl mx-auto px-6">
          <div className="accent-bar pl-4 mb-10">
            <h3 className="text-xl text-ink">Sponsor &amp; Offering Instructions</h3>
          </div>

          {/* Domestic */}
          <div className="bg-white rounded-xl border border-gold/20 shadow-sm p-6 sm:p-8 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <i className="ti ti-building-bank text-maroon text-2xl"></i>
              <h4 className="text-lg text-maroon">Domestic Offering (India)</h4>
            </div>
            <p className="text-[13px] text-ink-light leading-relaxed mb-6">
              Direct bank transfer for donors within India. Please ensure all details are entered correctly for monastery records.
            </p>
            <div className="space-y-1">
              <Row label="Account Name" value="Dundul Raptenling Monastery" />
              <Row label="Bank Name" value="Canara Bank" />
              <Row label="Account Number" value="0284101002037" />
              <Row label="IFSC Code" value="CNRB0000284" />
              <Row label="SWIFT Code" value="CNRBINBBBFD" />
              <Row label="UPI ID" value="55173129002037@cnrb" />
            </div>
            <p className="text-[12px] text-ink-mid italic bg-cream rounded-lg px-4 py-3 mt-6">
              Note: Kindly mention "Offering" or the specific Puja name in the remarks section of your transfer.
            </p>
          </div>

          {/* International (maroon card) */}
          <div className="bg-maroon-dark rounded-xl shadow-sm overflow-hidden text-gold-light">
            <div className="px-6 sm:px-8 py-5 flex items-center gap-3 border-b border-gold-light/10">
              <i className="ti ti-world text-2xl text-gold"></i>
              <h4 className="text-lg text-gold-light">International Offerings</h4>
            </div>
            <div className="p-6 sm:p-8">
              <div className="bg-black/15 border border-gold-light/10 rounded-lg p-4 mb-8">
                <h5 className="text-gold font-semibold mb-1">Vajra Lotus Foundation (501c3)</h5>
                <p className="text-[13px] text-gold-light/70 leading-relaxed">
                  Tax-deductible support for US-based donors. Our international partner facilitates global generosity with full transparency.
                </p>
              </div>

              <div className="mb-8">
                <p className="text-[12px] uppercase tracking-widest text-gold font-semibold mb-3">1. PayPal (Online)</p>
                <Row dark label="Email" value="vajralotusfoundation@gmail.com" />
                <p className="text-[12px] text-gold-light/60 italic mt-2">Instruction: Please include your name and donation purpose.</p>
              </div>

              <div className="mb-8">
                <p className="text-[12px] uppercase tracking-widest text-gold font-semibold mb-3">2. Wire Transfer</p>
                <Row dark label="Bank Name" value="Bank of America" />
                <Row dark label="Account Name" value="Vajra Lotus Foundation" />
                <Row dark label="Account Number" value="325288249393" />
                <Row dark label="Routing (Wire)" value="026009593" />
                <Row dark label="SWIFT / BIC" value="BOFAUS3N" />
                <Row dark label="Account Type" value="Checking" />
              </div>

              <div className="mb-8">
                <p className="text-[12px] uppercase tracking-widest text-gold font-semibold mb-3">3. Check</p>
                <Row dark label="Payable To" value="Vajra Lotus Foundation" />
                <Row dark label="Mailing Address" value="1924 E St, Hayward, CA 94541, USA" />
              </div>

              <a
                href={DONATION_URL}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 w-full py-4 bg-gold text-maroon-dark font-medium tracking-widest uppercase text-[13px] rounded-lg shadow-md hover:bg-gold-dark transition-all active:scale-[0.98]"
              >
                Online Donation Portal <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Quote banner */}
      <section className="relative h-[320px] flex items-center overflow-hidden">
        <img className="absolute inset-0 w-full h-full object-cover" alt="Himalayan monastery" src={cldw(IMG_QUOTE, 1920)} />
        <div className="absolute inset-0 bg-gradient-to-r from-maroon-dark/90 via-maroon-dark/70 to-transparent"></div>
        <div className="relative z-10 max-w-3xl mx-auto px-8 w-full">
          <h2 className="text-2xl sm:text-3xl text-gold-light font-serif italic mb-3">"Giving is the most sacred of rituals."</h2>
          <p className="text-white/80 max-w-md leading-relaxed">
            Every offering directly supports the preservation of Buddhist philosophy and the daily sustenance of our practitioners.
          </p>
        </div>
      </section>
    </div>
  );
}
