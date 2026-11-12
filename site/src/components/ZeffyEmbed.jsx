import { useEffect, useRef, useState } from "react";

// Zeffy payment form, embedded the way Zeffy's own snippet does it: a
// [data-zeffy-embed] box that zeffy-embed.js fills (and resizes), with a plain
// iframe as the fallback when the script can't load. `form` is the form path,
// e.g. "donation-form/support-the-zangdok-palri-consecration--2028".
// Not loaded during the prerender, so the static HTML has no third-party form.
const SCRIPT = "https://www.zeffy.com/embed/v2/zeffy-embed.js";

export default function ZeffyEmbed({ form, title = "Donation form powered by Zeffy" }) {
  const box = useRef(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    if (!form || navigator.webdriver) return;
    setFallback(false);
    // A fresh script tag each time, so the embed also runs after client-side navigation.
    const s = document.createElement("script");
    s.src = SCRIPT;
    s.async = true;
    s.onerror = () => setFallback(true);
    box.current?.appendChild(s);
    return () => s.remove();
  }, [form]);

  if (!form) return null;
  return (
    <div ref={box}>
      <div data-zeffy-embed data-form-url={`/embed/${form}`}></div>
      {fallback && (
        <div className="relative overflow-hidden w-full" style={{ height: 450 }}>
          <iframe
            title={title}
            src={`https://www.zeffy.com/embed/${form}`}
            className="absolute inset-0 w-full h-full border-0"
            allowpaymentrequest="true"
            allowtransparency="true"
          ></iframe>
        </div>
      )}
    </div>
  );
}
