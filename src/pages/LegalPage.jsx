import { useEffect } from "react";
import lastMileMarginLogo from "../assets/last-mile-margin-logo.png";
import lastMileMarginLogoDark from "../assets/last-mile-margin-logo-darkmode.png";
import { ArrowLeft, ShieldCheck } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// EDIT THESE before/right after launch. They flow into both documents.
//   • legalEntity   — the legal name that owns the service (LLC / Inc.).
//   • contactEmail  — where users reach you for legal / privacy requests.
//   • governingLaw  — the state/country whose law governs the Terms.
//   • effectiveDate — bump whenever you change either document.
// ─────────────────────────────────────────────────────────────────────────────
export const LEGAL_CONFIG = {
  productName: "Last Mile Margin",
  legalEntity: "Final Mile Margin LLC", // the registered company that operates the Last Mile Margin product
  contactEmail: "support@finalmilemargin.com", // monitored inbox for legal/privacy requests
  website: "finalmilemargin.com",
  governingLaw: "the State of Alabama, United States",
  effectiveDate: "June 9, 2026",
};

const { productName, legalEntity, contactEmail, website, governingLaw, effectiveDate } = LEGAL_CONFIG;

// A document is an array of { heading, body } blocks. `body` is an array whose
// items are either a string (paragraph) or { list: [...] } (bulleted list).
const TERMS = {
  title: "Terms of Service",
  intro: `These Terms of Service ("Terms") govern your access to and use of ${productName} (the "Service"), operated by ${legalEntity} ("we," "us," or "our"). By creating an account or using the Service, you agree to these Terms. If you do not agree, do not use the Service.`,
  sections: [
    {
      heading: "1. The Service",
      body: [
        `${productName} is a software tool that helps final-mile delivery contractors track route profitability and margin, manage claims and disputes, organize teams and documents, and surface AI-assisted insights based on the data you enter. The Service is provided on a subscription basis.`,
      ],
    },
    {
      heading: "2. Eligibility & accounts",
      body: [
        "You must be at least 18 years old and able to form a binding contract to use the Service. You are responsible for the accuracy of the information you provide and for all activity under your account.",
        "You are responsible for safeguarding your login credentials. Notify us promptly at the contact below if you suspect unauthorized access. You may invite team members to your workspace; you remain responsible for their use of the Service.",
      ],
    },
    {
      heading: "3. Subscriptions, billing & cancellation",
      body: [
        "Paid plans are billed in advance through our payment processor, Stripe. New accounts may begin with a free trial; if you do not cancel before the trial ends, your subscription begins automatically and your payment method is charged.",
        "Subscriptions renew automatically for successive billing periods until cancelled. You can cancel at any time from the billing portal in your account settings; cancellation takes effect at the end of the current billing period and you retain access until then.",
        { list: [
          "Fees are stated at checkout and may change on renewal with advance notice.",
          "Except where required by law, payments are non-refundable and we do not provide refunds or credits for partial periods.",
          "You authorize us and Stripe to charge your payment method for all fees incurred.",
        ] },
      ],
    },
    {
      heading: "4. Acceptable use",
      body: [
        "You agree not to misuse the Service. In particular, you will not:",
        { list: [
          "Use the Service for any unlawful purpose or to violate the rights of others.",
          "Upload content you do not have the right to share, or that is malicious, infringing, or unlawful.",
          "Attempt to gain unauthorized access to the Service, other accounts, or our systems.",
          "Reverse engineer, scrape, overload, or interfere with the Service or its underlying infrastructure.",
          "Resell or provide the Service to third parties except for your own authorized team members.",
        ] },
      ],
    },
    {
      heading: "5. Your data & content",
      body: [
        "You retain all rights to the data and files you submit to the Service (\"Your Content\"). You grant us a limited license to host, process, and display Your Content solely to operate and improve the Service for you, and to provide the features you use.",
        "You are responsible for the accuracy and legality of Your Content. We handle Your Content as described in our Privacy Policy.",
      ],
    },
    {
      heading: "6. AI features & no professional advice",
      body: [
        `${productName} includes AI-assisted features (for example, margin analysis, forecasts, dispute-letter drafting, and document parsing). These features generate suggestions and drafts based on the data you provide and may be inaccurate or incomplete.`,
        "AI outputs are provided for informational purposes only and do not constitute legal, financial, tax, accounting, or other professional advice. You are responsible for reviewing all outputs before relying on or acting on them. We are not liable for decisions you make based on AI-generated content.",
      ],
    },
    {
      heading: "7. Third-party services",
      body: [
        "The Service relies on third-party providers — including Stripe (payments), Supabase (hosting, database, and authentication), and Anthropic (AI processing). Your use of the Service may be subject to those providers' terms. We are not responsible for third-party services we do not control.",
      ],
    },
    {
      heading: "8. Disclaimers",
      body: [
        "The Service is provided \"as is\" and \"as available\" without warranties of any kind, whether express or implied, including warranties of merchantability, fitness for a particular purpose, and non-infringement. We do not warrant that the Service will be uninterrupted, error-free, or that any result or insight will be accurate.",
      ],
    },
    {
      heading: "9. Limitation of liability",
      body: [
        "To the maximum extent permitted by law, we will not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits, revenue, data, or goodwill, arising from or related to your use of the Service.",
        "Our total liability for any claim arising out of or relating to the Service will not exceed the amount you paid us for the Service in the twelve (12) months preceding the event giving rise to the claim.",
      ],
    },
    {
      heading: "10. Indemnification",
      body: [
        "You agree to indemnify and hold harmless us and our affiliates from any claims, damages, liabilities, and expenses arising from your use of the Service, Your Content, or your violation of these Terms.",
      ],
    },
    {
      heading: "11. Termination",
      body: [
        "You may stop using the Service and cancel your subscription at any time. We may suspend or terminate your access if you breach these Terms or if required to protect the Service or other users. On termination, your right to use the Service ends; provisions that by their nature should survive (such as ownership, disclaimers, and limitations of liability) will survive.",
      ],
    },
    {
      heading: "12. Changes to these Terms",
      body: [
        "We may update these Terms from time to time. If we make material changes, we will update the effective date above and, where appropriate, notify you. Your continued use of the Service after changes take effect constitutes acceptance of the updated Terms.",
      ],
    },
    {
      heading: "13. Governing law",
      body: [
        `These Terms are governed by the laws of ${governingLaw}, without regard to its conflict-of-laws rules. The courts located in that jurisdiction will have exclusive jurisdiction over any dispute arising from these Terms or the Service.`,
      ],
    },
    {
      heading: "14. Contact",
      body: [
        `Questions about these Terms? Contact us at ${contactEmail}.`,
      ],
    },
  ],
};

const PRIVACY = {
  title: "Privacy Policy",
  intro: `This Privacy Policy explains how ${legalEntity} ("we," "us," or "our") collects, uses, and protects your information when you use ${productName} (the "Service"). We are committed to handling your data responsibly and only as needed to provide the Service.`,
  sections: [
    {
      heading: "1. Information we collect",
      body: [
        "We collect the following categories of information:",
        { list: [
          "Account information — your name and email address when you create an account.",
          "Business and operational data you enter — route financials, claims, disputes, contracts, team members, reminders, and similar records you choose to store in the Service.",
          "Uploaded files — receipts, photos, evidence, and documents you upload, along with their metadata.",
          "Payment information — handled by Stripe. We do not store your full card number; we receive limited billing details and subscription status from Stripe.",
          "Usage and device data — basic technical information such as browser type and interactions, used to operate and improve the Service.",
        ] },
      ],
    },
    {
      heading: "2. How we use your information",
      body: [
        "We use your information to:",
        { list: [
          "Provide, maintain, and improve the Service and its features.",
          "Process subscriptions and payments through Stripe.",
          "Generate the AI-assisted insights, drafts, and analyses you request.",
          "Communicate with you about your account, security, and service updates.",
          "Protect the Service and our users, and comply with legal obligations.",
        ] },
        "We do not sell your personal information.",
      ],
    },
    {
      heading: "3. AI processing",
      body: [
        "When you use AI-assisted features, the relevant data you provide is sent to our AI provider, Anthropic, to generate a response. This data is processed to produce the requested output. Under Anthropic's commercial terms, your inputs and outputs are not used to train their models.",
        "AI features only run when you invoke them. You can choose not to use AI features.",
      ],
    },
    {
      heading: "4. How we share information (subprocessors)",
      body: [
        "We share information only with service providers that help us operate the Service, under appropriate confidentiality and data-protection obligations:",
        { list: [
          "Supabase — database, file storage, and authentication.",
          "Stripe — subscription billing and payment processing.",
          "Anthropic — AI processing for the features you use.",
          "Hosting/CDN providers — to deliver the application.",
        ] },
        "We may also disclose information if required by law, to enforce our Terms, or to protect the rights, safety, and security of our users and the Service. If we are involved in a merger or acquisition, your information may be transferred as part of that transaction.",
      ],
    },
    {
      heading: "5. Data retention",
      body: [
        "We retain your information for as long as your account is active or as needed to provide the Service. When you delete your account, we delete or anonymize your personal data and Your Content within a reasonable period, except where we must retain certain records to comply with legal, tax, or accounting obligations.",
      ],
    },
    {
      heading: "6. Your rights",
      body: [
        "Depending on your location, you may have the right to access, correct, export, or delete your personal information. You can:",
        { list: [
          "Access and edit most of your data directly in the Service.",
          "Export your data from your account settings.",
          "Delete your account and associated data from your account settings, or by contacting us.",
        ] },
        `To exercise any privacy right, contact us at ${contactEmail}.`,
      ],
    },
    {
      heading: "7. Security",
      body: [
        "We use industry-standard measures to protect your information, including encryption in transit, access controls, and per-account data isolation. No method of transmission or storage is completely secure, but we work to protect your data and to respond promptly to any incident.",
      ],
    },
    {
      heading: "8. Children",
      body: [
        "The Service is intended for businesses and users aged 18 and over. It is not directed to children, and we do not knowingly collect personal information from children.",
      ],
    },
    {
      heading: "9. International users",
      body: [
        "We operate the Service from the United States. If you access the Service from outside the United States, your information may be transferred to, stored, and processed in the United States and other countries where our service providers operate.",
      ],
    },
    {
      heading: "10. Changes to this policy",
      body: [
        "We may update this Privacy Policy from time to time. If we make material changes, we will update the effective date above and, where appropriate, notify you. Your continued use of the Service after changes take effect constitutes acceptance of the updated policy.",
      ],
    },
    {
      heading: "11. Contact",
      body: [
        `Questions about this Privacy Policy or your data? Contact us at ${contactEmail}.`,
      ],
    },
  ],
};

const DOCS = { terms: TERMS, privacy: PRIVACY };

function LegalPage({ doc = "terms", isDark = true, onBack }) {
  const content = DOCS[doc] || TERMS;
  const otherDoc = doc === "terms" ? "privacy" : "terms";

  // Always start the document at the top, even when switching between them.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [doc]);

  const shell = isDark
    ? "min-h-screen bg-slate-950 text-white"
    : "min-h-screen bg-slate-100 text-slate-950";
  const bar = isDark
    ? "border-white/10 bg-slate-950/80"
    : "border-slate-200 bg-white/80";
  const card = isDark
    ? "border-white/10 bg-slate-900/70"
    : "border-slate-200 bg-white";
  const muted = isDark ? "text-slate-400" : "text-slate-500";
  const heading = isDark ? "text-white" : "text-slate-900";
  const linkCls = isDark ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-700";
  const tabActive = isDark
    ? "bg-white/10 text-white"
    : "bg-white text-slate-900 shadow-sm";
  const tabIdle = isDark
    ? "text-slate-400 hover:text-white"
    : "text-slate-500 hover:text-slate-900";

  const go = (slug) => {
    window.history.pushState(null, "", `#/${slug}`);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  };

  return (
    <div className={shell}>
      {/* Top bar */}
      <header className={`sticky top-0 z-10 border-b backdrop-blur ${bar}`}>
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-5 py-3.5">
          <img
            src={isDark ? lastMileMarginLogoDark : lastMileMarginLogo}
            alt={productName}
            className="h-8 w-auto object-contain"
          />
          <button
            type="button"
            onClick={onBack}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-bold transition ${isDark ? "text-slate-300 hover:bg-white/10" : "text-slate-600 hover:bg-slate-200"}`}
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-10 sm:py-14">
        {/* Doc switcher */}
        <div className={`mb-8 inline-flex rounded-xl p-1 ${isDark ? "bg-white/5" : "bg-slate-200/70"}`}>
          {["terms", "privacy"].map((slug) => (
            <button
              key={slug}
              type="button"
              onClick={() => go(slug)}
              className={`rounded-lg px-4 py-1.5 text-sm font-bold transition ${doc === slug ? tabActive : tabIdle}`}
            >
              {slug === "terms" ? "Terms of Service" : "Privacy Policy"}
            </button>
          ))}
        </div>

        <h1 className={`text-3xl font-black tracking-tight sm:text-4xl ${heading}`}>{content.title}</h1>
        <p className={`mt-2 text-sm font-semibold ${muted}`}>Effective {effectiveDate}</p>

        <div className={`mt-8 rounded-2xl border p-6 sm:p-8 ${card}`}>
          <p className={`text-[15px] leading-7 ${isDark ? "text-slate-300" : "text-slate-700"}`}>{content.intro}</p>

          <div className="mt-8 space-y-8">
            {content.sections.map((section) => (
              <section key={section.heading}>
                <h2 className={`text-lg font-black tracking-tight ${heading}`}>{section.heading}</h2>
                <div className="mt-3 space-y-3">
                  {section.body.map((block, i) =>
                    typeof block === "string" ? (
                      <p key={i} className={`text-[15px] leading-7 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                        {block}
                      </p>
                    ) : (
                      <ul key={i} className="ml-1 space-y-2">
                        {block.list.map((item, j) => (
                          <li key={j} className={`flex gap-2.5 text-[15px] leading-7 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                            <span className={`mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full ${isDark ? "bg-blue-400" : "bg-blue-500"}`} />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    )
                  )}
                </div>
              </section>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className={`mt-8 flex flex-col items-center gap-2 text-center text-xs font-semibold ${muted}`}>
          <p className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            {productName} — {website}
          </p>
          <p>
            See also our{" "}
            <button type="button" onClick={() => go(otherDoc)} className={`font-bold ${linkCls}`}>
              {otherDoc === "terms" ? "Terms of Service" : "Privacy Policy"}
            </button>
            .
          </p>
        </div>
      </main>
    </div>
  );
}

export default LegalPage;
