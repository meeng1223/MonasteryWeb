import { useState } from "react";
import { createItem } from "./publicContent.js";
import { addToMailerLite } from "./mailerlite.js";
import { trackEvent } from "./analytics.js";
import { useBotGuard } from "./botGuard.jsx";

const WEB3FORMS_KEY = import.meta.env.VITE_WEB3FORMS_KEY;

// Shared newsletter subscribe logic — saves to Firestore "subscribers", adds the
// email to MailerLite and notifies via Web3Forms (same service as the contact form).
export function useNewsletter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | sent
  const guard = useBotGuard();

  const subscribe = async (e) => {
    e.preventDefault();
    if (status === "sending" || !email) return;
    setStatus("sending");

    // Bots get the normal "sent" state but nothing is saved or sent.
    if (guard.isBot()) {
      setStatus("sent");
      setEmail("");
      setTimeout(() => setStatus("idle"), 4000);
      return;
    }

    // 1) Lưu vào Firestore để xem trong admin — best effort
    try {
      await createItem("subscribers", { email });
    } catch (err) {
      console.warn("save subscriber:", err?.message);
    }

    // 2) Add to the MailerLite "Monastery Newsletter" group
    await addToMailerLite({ email, source: "newsletter" });

    // 3) Thông báo qua Web3Forms (nếu đã cấu hình key)
    try {
      if (WEB3FORMS_KEY) {
        await fetch("https://api.web3forms.com/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            access_key: WEB3FORMS_KEY,
            subject: "New newsletter subscriber",
            from_name: "Monastery Website",
            email,
            message: `New subscriber: ${email}`,
          }),
        });
      }
    } catch (err) {
      console.warn("web3forms:", err?.message);
    }

    trackEvent("sign_up", { method: "newsletter" });
    setStatus("sent");
    setEmail("");
    guard.reset();
    setTimeout(() => setStatus("idle"), 4000);
  };

  return { email, setEmail, status, subscribe, honeypot: guard.field };
}
