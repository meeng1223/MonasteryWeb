import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { NoIndex } from "../components/Seo.jsx";
import { NOT_FOUND_TITLE } from "../lib/notFound.js";

export default function NotFound() {
  const { pathname } = useLocation();

  // Runs after <Seo/> (an earlier sibling in Layout): a missing page gets its own
  // title and no canonical/og:url pointing at the bad URL. Also what the build
  // bakes into dist/404.html (served by Firebase Hosting with HTTP 404).
  useEffect(() => {
    document.title = NOT_FOUND_TITLE;
    document.head.querySelector('link[rel="canonical"]')?.remove();
    document.head.querySelector('meta[property="og:url"]')?.remove();
  }, [pathname]);

  return (
    <div className="bg-cream min-h-[70vh] flex items-center justify-center px-6 py-4xl">
      <div className="max-w-lg text-center">
        <NoIndex />
        <span className="font-label-eyebrow text-label-eyebrow uppercase tracking-[0.2em] text-gold block mb-base">Page Not Found</span>
        <h1 className="font-hero-title text-hero-title-mobile md:text-hero-title text-maroon mb-md">404</h1>
        <p className="font-body-md text-ink-mid mb-xl">
          The page you are looking for does not exist or may have been moved. May your path lead you back to the teachings.
        </p>
        <div className="flex flex-wrap justify-center gap-base">
          <Link
            to="/"
            className="bg-maroon text-white px-8 py-3 rounded-sm text-[11px] font-semibold tracking-widest uppercase hover:bg-maroon-mid transition-colors shadow-sm"
          >
            Return Home
          </Link>
          <Link
            to="/contact"
            className="border border-maroon text-maroon px-8 py-3 rounded-sm text-[11px] font-semibold tracking-widest uppercase hover:bg-maroon hover:text-white transition-colors"
          >
            Contact Us
          </Link>
        </div>
        <div className="mt-2xl flex items-center justify-center">
          <div className="h-px w-16 bg-gold/30"></div>
          <span className="mx-lg text-gold-dark">✦</span>
          <div className="h-px w-16 bg-gold/30"></div>
        </div>
      </div>
    </div>
  );
}
