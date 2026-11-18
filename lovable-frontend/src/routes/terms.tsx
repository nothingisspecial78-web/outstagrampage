import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Shield, Check, Heart, Sparkles, Footprints, Clock, Lock } from "lucide-react";
import { Postmark } from "@/components/hb/Postmark";
import { Wordmark } from "@/components/hb/AppShell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Outstagram" },
      { name: "description", content: "The calm, anti-addiction Terms of Service for Outstagram. Post less. Go somewhere. Meet someone." },
      { property: "og:title", content: "Terms of Service — Outstagram" },
      { property: "og:description", content: "Our pact with you: finite feeds, real world presence, and zero addiction loops." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-16 pt-2">
      <div className="flex items-center justify-between border-b border-sand pb-4">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-muted hover:text-ink">
          <ArrowLeft className="size-4" /> Back to Outstagram
        </Link>
        <Wordmark className="text-2xl" />
      </div>

      <header className="relative rounded-3xl border border-sand bg-paper-raised p-8 shadow-paper">
        <Postmark place="Terms of Service" date="NOV 2026" tone="moss" className="absolute -top-3 -right-3 size-24" />
        <span className="inline-flex items-center gap-1 rounded-full bg-moss/10 px-3 py-1 text-xs font-bold text-moss uppercase tracking-wider">
          <Shield className="size-3.5" /> Human-First Terms
        </span>
        <h1 className="mt-3 font-serif text-3xl sm:text-4xl font-bold text-ink">
          Terms of Service: The Anti-Addiction Pact
        </h1>
        <p className="mt-2 text-sm text-ink-muted leading-relaxed">
          Last revised: November 2026. These terms govern your use of Outstagram. Unlike traditional platforms designed to maximize screen time, Outstagram is designed to encourage your departure into the physical world.
        </p>
      </header>

      <div className="space-y-6 text-sm text-ink leading-relaxed">
        <section className="rounded-2xl border border-sand bg-paper-raised p-6 shadow-paper space-y-3">
          <h2 className="font-serif text-xl font-bold text-ink flex items-center gap-2">
            <Sparkles className="size-5 text-stamp" /> 1. Purpose & The Anti-Addiction Mandate
          </h2>
          <p>
            Outstagram is created as a direct antidote to algorithmic hyper-engagement and digital extraction. Our service exists to help you put down your device, walk through your city, support independent neighborhood makers, and gather with other humans in real space.
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-ink-muted">
            <li><b>Finite Moments:</b> You will never find an infinite scroll, algorithmic recommendations, or variable-reward dopamine loops here. When you reach the end of the rack, we invite you to close the tab.</li>
            <li><b>Quiet Spaces:</b> No unprompted push notifications, red badges designed to manipulate anxiety, or vanity view counts.</li>
            <li><b>Presence Over Extraction:</b> All features—from Daily Quests to Passport Stamps—are designed to terminate in offline action.</li>
          </ul>
        </section>

        <section className="rounded-2xl border border-sand bg-paper-raised p-6 shadow-paper space-y-3">
          <h2 className="font-serif text-xl font-bold text-ink flex items-center gap-2">
            <Footprints className="size-5 text-moss" /> 2. Grounded Physical Interactions
          </h2>
          <p>
            Members agree to engage thoughtfully with the physical world and respect local communities:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-ink-muted">
            <li><b>Location Verification:</b> Postcards and stamps can only be stamped when you are physically within range of a location or meetup partner. Spoofing locations or automating check-ins defeats the purpose of the platform and results in account suspension.</li>
            <li><b>Meetup Respect:</b> When meeting other members offline to unlock chats or share stamps, conduct yourself with basic neighborly kindness and mutual respect.</li>
            <li><b>Independent Places:</b> Community discounts and stamps are offered in partnership with local neighborhood shops. Respect shop staff and follow house rules.</li>
          </ul>
        </section>

        <section className="rounded-2xl border border-sand bg-paper-raised p-6 shadow-paper space-y-3">
          <h2 className="font-serif text-xl font-bold text-ink flex items-center gap-2">
            <Clock className="size-5 text-stamp" /> 3. Real-World Presence Rewards & Cashouts
          </h2>
          <p>
            Outstagram provides in-app points for stepping outside and meeting friends. Points may be withdrawn for cash or converted into partner store credits:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-ink-muted">
            <li>Points are awarded for authentic physical dwell time, quest completion, and verified peer-to-peer meetups.</li>
            <li>Fraudulent verification, automated emulation, or bad-faith point generation will void the accrued balance.</li>
            <li>Withdrawal requests are processed via ACH, PayPal, or local merchant vouchers within 1–2 business days.</li>
          </ul>
        </section>

        <section className="rounded-2xl border border-sand bg-paper-raised p-6 shadow-paper space-y-3">
          <h2 className="font-serif text-xl font-bold text-ink flex items-center gap-2">
            <Lock className="size-5 text-ink" /> 4. Respect for Privacy & Media
          </h2>
          <p>
            You retain ownership of the postcards and creative memories you post. By posting, you grant Outstagram a limited license to render your card in the finite rack for neighbors. You agree never to post unauthorized photographs of children, strangers' faces without consent, or abusive material.
          </p>
        </section>
      </div>

      <div className="text-center pt-4 border-t border-sand">
        <Button asChild className="bg-ink hover:bg-ink/90 text-paper-raised px-8">
          <Link to="/">I Agree & Return to Outstagram</Link>
        </Button>
      </div>
    </div>
  );
}