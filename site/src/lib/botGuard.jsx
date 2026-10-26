import { useRef, useState } from "react";

// Light spam protection for the public forms (contact, puja request, newsletter).
// Bots were submitting the contact form with scattered-dot Gmail addresses
// (e.g. "o.d.eq.esi.9.7.3@gmail.com") and ticking the newsletter box.

// Real visitors can't fill a form this fast.
const MIN_FILL_MS = 3000;

// Gmail ignores dots, so 3+ dots in a Gmail address is the generator's signature.
export function looksLikeSpamEmail(email) {
  const [local = "", domain = ""] = String(email).trim().toLowerCase().split("@");
  if (domain !== "gmail.com" && domain !== "googlemail.com") return false;
  return (local.match(/\./g) || []).length >= 3;
}

// Hidden "honeypot" field: people never see it, form-filling bots fill it in.
// isBot() is true when the honeypot is filled or the form was sent too quickly;
// callers then show the normal success state without sending anything.
export function useBotGuard() {
  const startedAt = useRef(Date.now());
  const [trap, setTrap] = useState("");

  const field = (
    <div
      aria-hidden="true"
      data-no-translate
      style={{ position: "absolute", left: "-10000px", top: "auto", width: 1, height: 1, overflow: "hidden" }}
    >
      <label>
        Leave this field empty
        <input
          type="text"
          name="company_website"
          tabIndex={-1}
          autoComplete="off"
          value={trap}
          onChange={(e) => setTrap(e.target.value)}
        />
      </label>
    </div>
  );

  const isBot = () => trap !== "" || Date.now() - startedAt.current < MIN_FILL_MS;
  const reset = () => {
    startedAt.current = Date.now();
    setTrap("");
  };

  return { field, isBot, reset };
}
