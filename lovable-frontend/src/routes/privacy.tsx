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
          <ul className="space-y-1.5 list-disc pl-5 text-ink-muted">
            <li>We will never sell, rent, license, or monetize your personal information or metadata.</li>
            <li>We do not build behavioral advertising profiles on our members.</li>
            <li>Our "Community Bulletin" consists strictly of static, informative neighborhood notices with zero user tracking.</li>
          </ul>
        </section>

        <section className="rounded-2xl border border-sand bg-paper-raised p-6 shadow-paper space-y-3">
          <h2 className="font-serif text-xl font-bold text-ink flex items-center gap-2">
            <Sparkles className="size-5 text-moss" /> 2. No Algorithmic Profiling or Mood Analysis
          </h2>
          <p>
            Outstagram does not train machine learning models on your emotional vulnerability, dwell time, or reading speed to trigger dopamine spikes. The finite rack is determined purely by geography (moments from people nearby) and time, with no manipulative ranking algorithms.
          </p>
        </section>

        <section className="rounded-2xl border border-sand bg-paper-raised p-6 shadow-paper space-y-3">
          <h2 className="font-serif text-xl font-bold text-ink flex items-center gap-2">
            <Radio className="size-5 text-moss" /> 3. Ephemeral Location & Bluetooth Proximity
          </h2>
          <p>
            We believe location history is the most sensitive data a human produces. We treat it accordingly:
          </p>
          <ul className="space-y-1.5 list-disc pl-5 text-ink-muted">
            <li><b>Ephemeral verification only:</b> Location is checked on-device to verify proximity when you stamp a postcard or check in at a partner venue.</li>
            <li><b>No persistent tracking logs:</b> We never log continuous breadcrumb paths, background movements, or daily commuter routes.</li>
            <li><b>Peer-to-peer discovery:</b> Offline meetups utilize localized Bluetooth Low Energy (BLE) beacons directly between devices, eliminating the need for central proximity servers.</li>
          </ul>
        </section>

        <section className="rounded-2xl border border-sand bg-paper-raised p-6 shadow-paper space-y-3">
          <h2 className="font-serif text-xl font-bold text-ink flex items-center gap-2">
            <Lock className="size-5 text-moss" /> 4. Encrypted & Confidential Communications
          </h2>
          <p>
            Your private direct messages and personal reflection logs are encrypted and accessible only to you and your chosen conversational partner. No internal staff, algorithms, or automated parsers read your private messages.
          </p>
        </section>

        <section className="rounded-2xl border border-sand bg-paper-raised p-6 shadow-paper space-y-3">
          <h2 className="font-serif text-xl font-bold text-ink flex items-center gap-2">
            <Database className="size-5 text-moss" /> 5. Data Sovereignty & Instant Deletion
          </h2>
          <p>
            Everything you post remains your property. You may request a complete data export of your postcards and stamps at any time in Settings. When you request account deletion, every database record associated with your identity is permanently wiped.
          </p>
        </section>

        <section className="rounded-2xl border border-sand bg-paper-raised p-6 shadow-paper space-y-3">
          <h2 className="font-serif text-xl font-bold text-ink flex items-center gap-2">
            <UserCheck className="size-5 text-moss" /> 6. Privacy Inquiries & Direct Contact
          </h2>
          <p>
            For any questions or privacy verification requests, reach out directly to our human team at:
          </p>
          <p className="font-mono text-xs text-stamp-ink font-semibold">
            privacy@outstagram.app
          </p>
        </section>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-dashed border-sand bg-paper p-6 text-center sm:text-left">
        <div>
          <p className="font-serif text-lg font-bold text-ink">Read our Terms of Service</p>
          <p className="text-xs text-ink-muted">Learn about the anti-addiction pact behind Outstagram.</p>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="outline" className="border-sand bg-paper-raised">
            <Link to="/terms">Terms of Service</Link>
          </Button>
          <Button asChild className="bg-moss text-paper-raised font-bold">
            <Link to="/">Go Outside</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
