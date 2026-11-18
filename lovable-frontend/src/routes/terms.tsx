import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Shield, CheckCircle2, HeartHandshake, EyeOff, Ban } from "lucide-react";
import { Wordmark } from "@/components/hb/AppShell";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Outstagram" },
      { name: "description", content: "Our terms of service. An anti-addiction pact designed to protect your attention, privacy, and real-world connection." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Back button & Brand */}
      <div className="mb-8 flex items-center justify-between border-b border-sand pb-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-ink hover:text-stamp-ink transition-colors"
        >
          <ArrowLeft className="size-4" /> Back to Home
        </Link>
        <Wordmark className="text-2xl" />
      </div>

      <header className="mb-10">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-stamp-soft px-3 py-1 text-xs font-bold text-stamp-ink uppercase tracking-wider">
          <Shield className="size-3.5" /> Mutual Agreement
        </span>
        <h1 className="mt-3 font-serif text-3xl font-extrabold text-ink sm:text-4xl">
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          Last revised: November 18, 2026 · The Anti-Addiction Pact
        </p>
      </header>

      <div className="prose prose-stone max-w-none space-y-8 text-ink leading-relaxed">
        {/* Core Principles */}
        <section className="rounded-2xl border border-sand bg-paper p-6 shadow-sm">
          <h2 className="flex items-center gap-2.5 font-serif text-xl font-bold text-ink">
            <HeartHandshake className="size-5 text-stamp-ink" />
            1. The Anti-Instagram Covenant
          </h2>
          <p className="mt-3 text-sm text-ink-muted">
            Outstagram is built on the belief that human attention is sacred and not for extraction.
            By using Outstagram, you enter into a shared pact with us:
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="size-4 shrink-0 text-moss mt-0.5" />
              <span><strong>Finite by Design:</strong> We cap your daily feed to 10 postcards. There is no infinite scroll and no infinite refresh. When you reach the end, we urge you to close the screen.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="size-4 shrink-0 text-moss mt-0.5" />
              <span><strong>No Algorithmic Manipulation:</strong> We do not rank, score, or sort content to provoke anger, envy, or prolonged dwell time. Postcards are displayed in simple reverse-chronological neighborhood order.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="size-4 shrink-0 text-moss mt-0.5" />
              <span><strong>Presence Over Performance:</strong> We deliberately exclude follower counts, public likes, and vanity scoreboards. Engagement metrics are hidden because you are a person, not a profile to optimize.</span>
            </li>
          </ul>
        </section>

        {/* Real-World Presence & Community Standards */}
        <section className="rounded-2xl border border-sand bg-paper p-6 shadow-sm">
          <h2 className="flex items-center gap-2.5 font-serif text-xl font-bold text-ink">
            <Ban className="size-5 text-stamp-ink" />
            2. Community Conduct & Real-World Safety
          </h2>
          <p className="mt-3 text-sm text-ink-muted">
            To ensure physical and digital peace for all members:
          </p>
          <ul className="mt-3 space-y-2 text-sm text-ink">
            <li>• <strong>Consent in Public Spaces:</strong> Postcards should celebrate places, architecture, crafts, nature, and shared moments. Respect strangers’ privacy and never publish identifying photos of individuals without consent.</li>
            <li>• <strong>No Harassment or Bullying:</strong> We have zero tolerance for hate speech, predatory behavior, or harassment. Violating accounts are immediately reviewed and removed by human moderators.</li>
            <li>• <strong>Authentic Presence:</strong> Do not spoof your location or automate visits. Quests and stamps are meant to be felt with your own feet and eyes.</li>
          </ul>
        </section>

        {/* Offline Experiment & Coach Guidance */}
        <section className="rounded-2xl border border-sand bg-paper p-6 shadow-sm">
          <h2 className="flex items-center gap-2.5 font-serif text-xl font-bold text-ink">
            <EyeOff className="size-5 text-stamp-ink" />
            3. AI Life Coach Disclaimers
          </h2>
          <p className="mt-3 text-sm text-ink">
            The Hereabouts AI Life Coach offers calm, offline micro-experiments designed to help you disconnect from digital habits.
            It is an educational and reflective tool. It is <strong>not a medical, psychological, or crisis therapy provider</strong>. If you are experiencing distress, please reach out to trusted friends, family, or healthcare professionals in your area.
          </p>
        </section>

        {/* Account Termination & Freedom */}
        <section className="rounded-2xl border border-sand bg-paper p-6 shadow-sm">
          <h2 className="font-serif text-xl font-bold text-ink">
            4. Freedom to Leave Anytime
          </h2>
          <p className="mt-3 text-sm text-ink">
            You may export your quest reflections, stamps, and postcards or delete your account at any time through Settings. We will never hide the exit door or make leaving painful.
          </p>
        </section>
      </div>

      <footer className="mt-12 border-t border-sand pt-6 text-center text-xs text-ink-muted">
        <p>© 2026 Outstagram · Post less. Go somewhere. Meet someone.</p>
        <div className="mt-2 flex justify-center gap-4">
          <Link to="/privacy" className="hover:text-stamp-ink underline">Privacy Policy</Link>
          <Link to="/" className="hover:text-stamp-ink underline">Home</Link>
        </div>
      </footer>
    </div>
  );
}
