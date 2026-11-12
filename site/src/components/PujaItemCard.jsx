import { INR_PER_USD } from "../data/pujaList.js";

// One puja from PUJA_LIST: Tibetan name, amount (₹), English name and length.
export const fmt = (n) => {
  const num = Number(n);
  return Number.isFinite(num) ? num.toLocaleString("en-IN") : n;
};
// Approximate US$ for a rupee amount, rounded to whole dollars.
export const usd = (inr) => {
  const num = Number(inr);
  return Number.isFinite(num) ? Math.round(num / INR_PER_USD).toLocaleString("en-US") : "";
};

// showName: false in Tibetan mode, where the English name would be translated
// into the same Tibetan title already shown above it.
export function PujaCard(p, showName) {
  return (
    <div key={`${p.cat}-${p.si}`} className="p-6 rounded-lg border border-outline-variant bg-white transition-all hover:shadow-md flex flex-col">
      <div className="flex justify-between items-start gap-3 mb-3">
        <span className="font-serif text-maroon/70 text-base leading-snug">{p.tib}</span>
        <span className="text-right whitespace-nowrap">
          <span className="block text-gold-dark font-semibold">₹{fmt(p.amount)}</span>
          <span className="block text-[12px] text-ink-light">≈ ${usd(p.amount)}</span>
        </span>
      </div>
      {showName && p.en && <h4 className="text-[16px] text-ink leading-snug mb-3">{p.en}</h4>}
      <div className="flex items-center justify-between mt-auto pt-1">
        <span className="flex items-center gap-2 text-[11px] text-ink-light uppercase tracking-wider"><i className="ti ti-calendar text-gold"></i> {p.days}</span>
      </div>
    </div>
  );
}
