import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { analyticsAvailable, readConsent, setConsent } from "../lib/analytics.js";

// Small bar at the bottom of the screen asking once whether Google Analytics
// may be used. Nothing is sent to Google until the visitor accepts; the choice
// is remembered in this browser. Text is translated by the site's dictionaries.
export default function ConsentBanner() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(analyticsAvailable && readConsent() === null);
  }, []);

  if (!open) return null;

  const choose = (value) => {
    setConsent(value);
    setOpen(false);
  };

  return (
    <div
      role="region"
      aria-label="Analytics cookies"
      className="fixed inset-x-0 bottom-0 z-[60] px-3 pb-3 sm:px-6 sm:pb-6 pointer-events-none"
    >
      <div className="pointer-events-auto mx-auto max-w-3xl bg-white/95 backdrop-blur border border-gold/30 shadow-lg rounded-md px-4 py-3 sm:px-5 sm:py-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <p className="flex-1 text-[13px] leading-snug text-ink-mid">
          <span>We use Google Analytics cookies to understand how many people visit and how they find this website. No advertising.</span>{" "}
          <Link to="/privacy" className="text-maroon underline hover:text-gold">Privacy policy</Link>
        </p>
        <div className="flex gap-2 shrink-0 justify-end">
          <button
            type="button"
            onClick={() => choose("denied")}
            className="px-4 py-1.5 text-[13px] border border-maroon/40 text-maroon rounded-sm hover:bg-maroon/5"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={() => choose("granted")}
            className="px-4 py-1.5 text-[13px] bg-maroon text-white rounded-sm hover:bg-maroon/90"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
