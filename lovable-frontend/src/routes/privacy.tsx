import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Lock, ShieldCheck, Database, EyeOff, Radio } from "lucide-react";
import { Wordmark } from "@/components/hb/AppShell";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Outstagram" },
      { name: "description", content: "Our privacy policy. Zero advertising trackers, no surveillance capitalism, and on-device privacy." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
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
          <Lock className="size-3.5" /> Privacy First
        </span>
        <h1 className="mt-3 font-serif text-3xl font-extrabold text-ink sm:text-4xl">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          Last revised: November 18, 2026 · Built to protect, not to profile.
        </p>
      </header>

      <div className="prose prose-stone max-w-none space-y-8 text-ink leading-relaxed">
        {/* Zero Surveillance Pledge */}
        <section className="rounded-2xl border border-sand bg-paper p-6 shadow-sm">
          <h2 className="flex items-center gap-2.5 font-serif text-xl font-bold text-ink">
            <EyeOff className="size-5 text-stamp-ink" />
            1. Zero Surveillance Capitalism
          </h2>
          <p className="mt-3 text-sm text-ink-muted">
            Traditional social media monetizes your intimate psychological profile and sells access to advertisers. Outstagram does not:
          </p>
          <ul className="mt-3 space-y-2 text-sm text-ink">
            <li>• <strong>No Tracking Pixels:</strong> We do not load Meta Pixel, Google Analytics surveillance tags, or cross-site fingerprinting scripts.</li>
            <li>• <strong>No Data Brokering:</strong> We never sell, rent, or trade your personal data, location history, or messages to third-party data brokers.</li>
            <li>• <strong>No Behavioral Targeting:</strong> Commercial notices are strictly informative community bulletin items from local neighborhood businesses, never targeted via your behavioral history.</li>
          </ul>
        </section>

        {/* Ephemeral & On-Device Location */}
        <section className="rounded-2xl border border-sand bg-paper p-6 shadow-sm">
          <h2 className="flex items-center gap-2.5 font-serif text-xl font-bold text-ink">
            <Radio className="size-5 text-stamp-ink" />
            2. How We Handle Location Data
          </h2>
          <p className="mt-3 text-sm text-ink">
            When you complete a quest or check in at a neighborhood place:
          </p>
          <ul className="mt-3 space-y-2 text-sm text-ink">
            <li>• <strong>Ephemeral Verification:</strong> Location checks occur on your device to verify proximity to a place (e.g., Riverside Cafe). Your continuous GPS coordinates are never stored in a permanent location timeline on our servers.</li>
            <li>• <strong>Bluetooth Peer Discovery:</strong> In-person meetups utilize ephemeral, random rotating Bluetooth Low Energy tokens. We do not track where you walk throughout your day.</li>
          </ul>
        </section>

        {/* Private Encrypted Communication */}
        <section className="rounded-2xl border border-sand bg-paper p-6 shadow-sm">
          <h2 className="flex items-center gap-2.5 font-serif text-xl font-bold text-ink">
            <ShieldCheck className="size-5 text-stamp-ink" />
            3. Chat, Voice & Video Privacy
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-ink">
            <li>• <strong>WebRTC Peer-to-Peer Calls:</strong> Real-time voice and video calls connect directly between devices via encrypted WebRTC channels (DTLS/SRTP). Your live voice and camera feeds do not pass through recording servers.</li>
            <li>• <strong>Chat finite limits:</strong> Messages between members unlock in thoughtful increments (+20) after meeting in real life.</li>
            <li>• <strong>Voice Notes:</strong> Stored securely with private Supabase row-level security policies accessible only to the conversation participants.</li>
          </ul>
        </section>

        {/* Data Retention & Rights */}
        <section className="rounded-2xl border border-sand bg-paper p-6 shadow-sm">
          <h2 className="flex items-center gap-2.5 font-serif text-xl font-bold text-ink">
            <Database className="size-5 text-stamp-ink" />
            4. Your Data, Your Control
          </h2>
          <p className="mt-3 text-sm text-ink">
            Under GDPR, CCPA, and human rights principles:
          </p>
          <ul className="mt-3 space-y-2 text-sm text-ink">
            <li>• You can export your full data archive (postcards, stamps, and quest logs).</li>
            <li>• You can request instantaneous deletion of your account and all associated entries from our database.</li>
          </ul>
        </section>
      </div>

      <footer className="mt-12 border-t border-sand pt-6 text-center text-xs text-ink-muted">
        <p>© 2026 Outstagram · Post less. Go somewhere. Meet someone.</p>
        <div className="mt-2 flex justify-center gap-4">
          <Link to="/terms" className="hover:text-stamp-ink underline">Terms of Service</Link>
          <Link to="/" className="hover:text-stamp-ink underline">Home</Link>
        </div>
      </footer>
    </div>
  );
}
