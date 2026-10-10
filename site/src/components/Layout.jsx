import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import Nav from "./Nav.jsx";
import Footer from "./Footer.jsx";
import Seo from "./Seo.jsx";
import ConsentBanner from "./ConsentBanner.jsx";

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <Seo />
      <Nav />
      {/* pt-28 desktop (two-line header) / pt-16 mobile (single line) */}
      <main className="flex-1 pt-16 lg:pt-28">
        {/* Pages load as separate chunks (App.jsx). The current page is preloaded
            before the first render and navigations keep the old page until the
            new one is ready, so this fallback is rarely seen; it keeps the footer
            down meanwhile. The prerender waits until it is gone. */}
        <Suspense fallback={<div data-route-loading="" className="min-h-[70vh]" />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <ConsentBanner />
    </div>
  );
}
