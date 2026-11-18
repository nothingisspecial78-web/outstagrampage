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
          <ul className="space-y-1.5 list-disc pl-5 text-ink-muted">
            <li>We do not optimize for "Daily Active Minutes" or continuous scrolling.</li>
            <li>We provide a finite selection of ten postcards per day, after which the rack ends.</li>
            <li>We will never send deceptive push notifications or guilt-inducing "streaks" to pull you back online.</li>
          </ul>
        </section>

        <section className="rounded-2xl border border-sand bg-paper-raised p-6 shadow-paper space-y-3">
          <h2 className="font-serif text-xl font-bold text-ink flex items-center gap-2">
            <Footprints className="size-5 text-stamp" /> 2. Physical Presence, Stamps & Offline Verification
          </h2>
          <p>
            Passport stamps and points are granted for real-world presence (visiting quiet local places, completing outdoor reflections, and meeting friends).
          </p>
          <ul className="space-y-1.5 list-disc pl-5 text-ink-muted">
            <li>Location checks are performed on-device to confirm you are in the vicinity of a place or meetup.</li>
            <li>GPS spoofing, automated location tampering, or bot activity constitutes a violation of these terms and may result in immediate suspension.</li>
            <li>Demo Mode is provided strictly for accessibility, testing, and simulator preview purposes.</li>
          </ul>
        </section>

        <section className="rounded-2xl border border-sand bg-paper-raised p-6 shadow-paper space-y-3">
          <h2 className="font-serif text-xl font-bold text-ink flex items-center gap-2">
            <Heart className="size-5 text-stamp" /> 3. Respect for People and Public Spaces
          </h2>
          <p>
            Postcards shared to the finite rack are visible to neighbors. You agree that any photograph, video, or note you share:
          </p>
          <ul className="space-y-1.5 list-disc pl-5 text-ink-muted">
            <li>Does not photograph strangers up close without their clear verbal consent.</li>
            <li>Does not contain harassment, hate speech, commercial spam, or deceptive marketing.</li>
            <li>Respects quiet residential hours and natural sanctuaries.</li>
          </ul>
        </section>

        <section className="rounded-2xl border border-sand bg-paper-raised p-6 shadow-paper space-y-3">
          <h2 className="font-serif text-xl font-bold text-ink flex items-center gap-2">
            <Clock className="size-5 text-stamp" /> 4. Paced Direct Messages & Unlocking
          </h2>
          <p>
            To prevent unsolicited digital deluge, private chats on Outstagram are intentionally capped. When you first exchange messages with another member, you receive a finite allowance of messages. To unlock further messages, both members meet in the physical world or confirm an in-person friend code.
          </p>
        </section>

        <section className="rounded-2xl border border-sand bg-paper-raised p-6 shadow-paper space-y-3">
          <h2 className="font-serif text-xl font-bold text-ink flex items-center gap-2">
            <Lock className="size-5 text-stamp" /> 5. In-App Points & Cashout Rewards
          </h2>
          <p>
            In-app points earned through verified real-world activity may be redeemed for vouchers with local partners or converted into cash payouts subject to standard anti-fraud checks and minimum payout thresholds ($1.00 USD / 100 points).
          </p>
          <p className="text-ink-muted">
            Payout funds originate from ethical merchant partnerships and patron grants, never from programmatic ad auctioning or behavioral data broking.
          </p>
        </section>

        <section className="rounded-2xl border border-sand bg-paper-raised p-6 shadow-paper space-y-3">
          <h2 className="font-serif text-xl font-bold text-ink">6. Account Deletion & Leaving Anytime</h2>
          <p>
            You are free to leave Outstagram at any moment. Account deletion completely expunges your profile, messages, and postcards from our servers. We view spending less time on our application as a success, not a churn event.
          </p>
        </section>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-dashed border-sand bg-paper p-6 text-center sm:text-left">
        <div>
          <p className="font-serif text-lg font-bold text-ink">Have questions about our terms?</p>
          <p className="text-xs text-ink-muted">Our community steward team is here to listen.</p>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="outline" className="border-sand bg-paper-raised">
            <Link to="/privacy">Read Privacy Policy</Link>
          </Button>
          <Button asChild className="bg-stamp text-primary-foreground">
            <Link to="/">Return Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
