import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ShieldCheck, EyeOff, Lock, Database, Radio, Sparkles, UserCheck } from "lucide-react";
import { Postmark } from "@/components/hb/Postmark";
import { Wordmark } from "@/components/hb/AppShell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Outstagram" },
      { name: "description", content: "Outstagram Privacy Policy: Zero tracking, no algorithmic feed profiling, zero ads data sale, private encrypted storage." },
      { property: "og:title", content: "Privacy Policy — Outstagram" },
      { property: "og:description", content: "Your location, messages, and memories stay private. No tracking, ever." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-16 pt-2">
      <div className="flex items-center justify-between border-b border-sand pb-4">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-muted hover:text-ink">
          <ArrowLeft className="size-4" /> Back to Outstagram
        </Link>
        <Wordmark className="text-2xl" />
      </div>

      <header className="relative rounded-3xl border border-sand bg-paper-raised p-8 shadow-paper">
        <Postmark place="Privacy Policy" date="NOV 2026" tone="moss" className="absolute -top-3 -right-3 size-24" />
        <span className="inline-flex items-center gap-1 rounded-full bg-moss/10 px-3 py-1 text-xs font-bold text-moss uppercase tracking-wider">
          <ShieldCheck className="size-3.5" /> Privacy-By-Design
        </span>
        <h1 className="mt-3 font-serif text-3xl sm:text-4xl font-bold text-ink">
          Privacy Policy: Your Life Belongs to You
        </h1>
        <p className="mt-2 text-sm text-ink-muted leading-relaxed">
          Last revised: November 2026. Most social networks exist to collect behavioral dossiers and sell your attention to ad brokers. Outstagram is built on the inverse principle: zero tracking, no algorithmic feeds, zero data sales, and local peer privacy.
        </p>
      </header>

      <div className="space-y-6 text-sm text-ink leading-relaxed">
        <section className="rounded-2xl border border-sand bg-paper-raised p-6 shadow-paper space-y-3">
          <h2 className="font-serif text-xl font-bold text-ink flex items-center gap-2">
            <EyeOff className="size-5 text-moss" /> 1. Zero Tracking & No Ad Brokers
          </h2>
          <p>
            We do not embed third-party surveillance scripts, cross-site trackers, Facebook Pixel, Google AdSense, or data broker beacons.
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-ink-muted">
            <li><b>No Behavior Profiling:</b> We do not track which postcards you look at, how long you linger on images, or your typing habits.</li>
            <li><b>No Ad Retargeting:</b> The offers and notices in Outstagram are static community bulletin posts, not personalized behavioral advertisements.</li>
            <li><b>Zero Data Sales:</b> We have never sold, rented, or monetized member data, and never will.</li>
          </ul>
        </section>

        <section className="rounded-2xl border border-sand bg-paper-raised p-6 shadow-paper space-y-3">
          <h2 className="font-serif text-xl font-bold text-ink flex items-center gap-2">
            <Radio className="size-5 text-stamp" /> 2. Location Verification Without Continuous Tracking
          </h2>
          <p>
            Outstagram only requests your location when you explicitly choose to stamp a postcard, verify a physical visit to a local shop, or join an in-person meetup.
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-ink-muted">
            <li>We do not record background movement trajectories or keep breadcrumb GPS tracks.</li>
            <li>Location checks evaluate point proximity to a venue radius, verify the stamp, and immediately discard the coordinates.</li>
            <li>Peer-to-peer meetups use Bluetooth low-energy proximity sensing locally between devices without transmitting continuous GPS to any central server.</li>
          </ul>
        </section>

        <section className="rounded-2xl border border-sand bg-paper-raised p-6 shadow-paper space-y-3">
          <h2 className="font-serif text-xl font-bold text-ink flex items-center gap-2">
            <Lock className="size-5 text-ink" /> 3. Real-Time Communication & WebRTC Calls
          </h2>
          <p>
            Voice and video calls on Outstagram connect directly between you and your friend via standard WebRTC peer-to-peer protocols.
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-ink-muted">
            <li>Audio and video streams travel directly device-to-device with end-to-end encryption.</li>
            <li>Our signaling server facilitates connection handshakes and exchanges no audio or video content.</li>
            <li>No call audio or video is recorded or stored on Outstagram servers.</li>
          </ul>
        </section>

        <section className="rounded-2xl border border-sand bg-paper-raised p-6 shadow-paper space-y-3">
          <h2 className="font-serif text-xl font-bold text-ink flex items-center gap-2">
            <Database className="size-5 text-moss" /> 4. Data Storage & Deletion
          </h2>
          <p>
            Your account, postcards, stamps, and crafts are stored securely in encrypted databases. You can export or permanently delete your account and all associated logs at any time from Settings.
          </p>
        </section>
      </div>

      <div className="text-center pt-4 border-t border-sand">
        <Button asChild className="bg-ink hover:bg-ink/90 text-paper-raised px-8">
          <Link to="/">Back to Outstagram</Link>
        </Button>
      </div>
    </div>
  );
}