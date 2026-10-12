// Tibetan Nyingmapa Calendar app privacy policy, from the app team's
// privacy-policy.html (12 Oct 2026 handoff). The wording is a legal statement
// matching the App Store privacy answers: restyle freely, but don't change any
// text without the owner's OK.

const link = "text-maroon hover:text-maroon-dark underline";
const h2 = "font-subheading text-subheading text-maroon mb-3";
const ul = "list-disc pl-6 space-y-1";
// Below md the table stacks: one card per row, each cell labelled with its column name.
const td = "block md:table-cell py-2 md:p-3 align-top before:content-[attr(data-label)] before:block before:text-xs before:font-semibold before:uppercase before:tracking-wider before:text-gold-dark md:before:content-none";

const SHARED = [
  {
    feature: "Zoe (beta), the AI guide (optional)",
    sent: "Your question, with the earlier messages of the same chat; your first name (the first word of your profile name, never your full name); your Tibetan birth year with today's reading details (for example your life-force day). Never your birth date. A random install ID.",
    to: (
      <>
        Our server, run on Cloudflare, passes the question to <b>Google Gemini</b>, which writes the answer. Our server does not store questions or answers; it keeps only the install ID and a count of your questions for up to 40 days, to apply the daily limit. Google processes the request under its own terms and may use it to improve its services.
      </>
    ),
  },
  {
    feature: "Weather (optional)",
    sent: "Your approximate location, rounded to about 1 km, only if you allow location access.",
    to: "Open-Meteo (open-meteo.com) returns the forecast, and Apple's location services return your city name. This happens only to show the weather; we do not receive or store your location.",
  },
  {
    feature: "News alerts (optional)",
    sent: "A subscription to news in your app language, and an install ID created by Firebase.",
    to: "Google Firebase Cloud Messaging delivers the alerts. We do not store device tokens.",
  },
  {
    feature: "Calendar, images and news",
    sent: "Standard requests to download content (as any app or website does, these include your IP address).",
    to: "Our content servers on Cloudflare. We do not use this to identify you.",
  },
];

export default function CalendarPrivacy() {
  return (
    <div className="bg-cream min-h-screen">
      <header className="relative bg-maroon text-gold-light py-4xl">
        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <h1 className="font-page-banner text-page-banner mb-md">Privacy Policy</h1>
          <p className="font-body-md text-gold-light/90">Tibetan Nyingmapa Calendar app · Dundul Raptenling Monastery<br />Effective 9 October 2026</p>
          <div className="w-12 h-px bg-gold/40 mx-auto mt-lg"></div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-2xl md:py-4xl">
        <div className="prose prose-stone max-w-none font-body-md text-ink-mid leading-relaxed space-y-8">
          <section>
            <p>This policy explains what the Tibetan Nyingmapa Calendar app ("the app") does with information about you. The app is offered by Dundul Raptenling Monastery ("we"). It does not require an account and has no advertising, analytics or tracking.</p>
          </section>
          <section>
            <h2 className={h2}>Information that stays on your phone</h2>
            <p>These are stored only on your device. We never receive them, and they are deleted when you delete the app:</p>
            <ul className={ul}>
              <li>your profile (display name, optional email and bio) and profile photo;</li>
              <li>your date of birth and birth profile for My Astrology (the reading is worked out on the phone);</li>
              <li>your practices, events, reminders and notification settings;</li>
              <li>your conversations with Zoe (only today's chat is kept, on this phone; it is deleted at midnight or when you turn Zoe off).</li>
            </ul>
          </section>
          <section>
            <h2 className={h2}>Information that leaves your phone</h2>
            <table className="block md:table w-full border-collapse text-left">
              <thead className="hidden md:table-header-group">
                <tr className="border-b border-gold/40">
                  <th className="p-3 text-sm text-gold-dark">Feature</th>
                  <th className="p-3 text-sm text-gold-dark">What is sent</th>
                  <th className="p-3 text-sm text-gold-dark">To whom, and why</th>
                </tr>
              </thead>
              <tbody className="block md:table-row-group">
                {SHARED.map((row) => (
                  <tr key={row.feature} className="block md:table-row border-b border-gold/30 py-3 md:py-0">
                    <td data-label="Feature" className={`${td} font-semibold text-ink`}>{row.feature}</td>
                    <td data-label="What is sent" className={td}>{row.sent}</td>
                    <td data-label="To whom, and why" className={td}>{row.to}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          <section>
            <h2 className={h2}>Your agreement for Zoe</h2>
            <p>Before your first question, the app explains what is sent to Google and asks for your agreement. You are asked once. You can withdraw it, or give it again, at any time in <b>Profile → My Astrology → Share questions with Google Gemini</b>. When it is off, nothing is sent to Zoe. Zoe is not yet offered in the European Economic Area, the United Kingdom or Switzerland.</p>
            <p className="mt-4">Please don't share private details in your questions. Zoe can make mistakes; its answers are for reflection and study and are not a substitute for a qualified teacher, astrologer, doctor or other professional.</p>
          </section>
          <section>
            <h2 className={h2}>Camera and photos</h2>
            <p>The app uses the camera or photo library only if you choose a profile photo. The photo stays on your device.</p>
          </section>
          <section>
            <h2 className={h2}>Children</h2>
            <p>The app is not directed at children under 13, and we do not knowingly collect information from them.</p>
          </section>
          <section>
            <h2 className={h2}>Your choices</h2>
            <ul className={ul}>
              <li>Turn Zoe on or off in Profile → My Astrology.</li>
              <li>Allow or deny location and notifications in your iPhone Settings at any time.</li>
              <li>Delete the app to remove everything stored on your phone. Zoe's question count expires by itself within 40 days.</li>
            </ul>
          </section>
          <section>
            <h2 className={h2}>Changes</h2>
            <p>If we change what the app does with your information, we will update this page and its effective date.</p>
          </section>
          <section>
            <h2 className={h2}>Contact</h2>
            <p>Questions about this policy: <a className={link} href="mailto:contact@dundulraptenling.org">contact@dundulraptenling.org</a></p>
          </section>
        </div>
      </main>
    </div>
  );
}
