import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Compass, Heart, Footprints, ShieldCheck, Sparkles, MapPin, Gift, Hourglass } from "lucide-react";
import { Postmark } from "@/components/hb/Postmark";
import { Wordmark } from "@/components/hb/AppShell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Outstagram — The Anti-Instagram Manifesto" },
      { name: "description", content: "Post less. Go somewhere. Meet someone. Learn why Outstagram replaces infinite scrolling with real-world moments." },
      { property: "og:title", content: "About Outstagram" },
      { property: "og:description", content: "The calm web app designed to get you offline and back into the physical world." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-16 pt-2 px-4 sm:px-0">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-sand pb-4">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-muted hover:text-ink transition-colors">
          <ArrowLeft className="size-4" /> Back to Outstagram
        </Link>
        <Wordmark className="text-2xl" />
      </div>

      {/* Hero Card */}
      <header className="relative rounded-3xl border border-sand bg-paper-raised p-6 sm:p-8 shadow-paper overflow-hidden">
        <Postmark place="The Manifesto" date="EST. 2026" tone="ink" className="absolute -top-3 -right-3 size-24 sm:size-28" />
        <span className="inline-flex items-center gap-1 rounded-full bg-stamp-soft px-3 py-1 text-xs font-bold text-stamp-ink uppercase tracking-wider">
          <Compass className="size-3.5" /> Quiet Social Architecture
        </span>
        <h1 className="mt-4 font-serif text-3xl sm:text-4xl font-extrabold text-ink leading-tight">
          Post less. Go somewhere.<br />Meet someone.
        </h1>
        <p className="mt-3 max-w-xl text-base sm:text-lg text-ink-muted font-normal leading-relaxed">
          Outstagram was created to solve a quiet modern crisis: platforms optimized to keep our eyes glued to glowing glass rectangles. We engineered the exact opposite—a calm web experience designed to set you free.
        </p>
      </header>

      {/* Core Pillars */}
      <div className="grid gap-5 sm:grid-cols-2">
        <section className="rounded-2xl border border-sand bg-paper-raised p-6 shadow-paper">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-stamp-soft text-stamp-ink">
              <Hourglass className="size-5" />
            </span>
            <h2 className="font-serif text-xl font-bold text-ink">Finite Rack of 10</h2>
          </div>
          <p className="mt-3 text-sm text-ink-muted leading-relaxed">
            No infinite scroll feeds. Once you have seen today’s 10 local postcards, your feed gracefully ends with a reminder to step outside and experience your city.
          </p>
        </section>

        <section className="rounded-2xl border border-sand bg-paper-raised p-6 shadow-paper">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-moss/10 text-moss">
              <MapPin className="size-5" />
            </span>
            <h2 className="font-serif text-xl font-bold text-ink">Physical Presence</h2>
          </div>
          <p className="mt-3 text-sm text-ink-muted leading-relaxed">
            Postcards can only be captured in the real world when you are physically at a local independent shop, park, cafe, or maker space.
          </p>
        </section>

        <section className="rounded-2xl border border-sand bg-paper-raised p-6 shadow-paper">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-badge/10 text-badge">
              <Gift className="size-5" />
            </span>
            <h2 className="font-serif text-xl font-bold text-ink">Rewards & Stamps</h2>
          </div>
          <p className="mt-3 text-sm text-ink-muted leading-relaxed">
            Every real-world walk and shop visit stamps your personal passport. Unlock genuine local partner perks, movie tickets, and handcrafted rewards.
          </p>
        </section>

        <section className="rounded-2xl border border-sand bg-paper-raised p-6 shadow-paper">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-stamp/10 text-stamp">
              <Sparkles className="size-5" />
            </span>
            <h2 className="font-serif text-xl font-bold text-ink">AI Life Coach</h2>
          </div>
          <p className="mt-3 text-sm text-ink-muted leading-relaxed">
            A gentle companion limited to three thoughtful messages a day. Never keeps you chatting; always offers a single small offline experiment to reset your rhythm.
          </p>
        </section>
      </div>

      {/* The Pact */}
      <section className="rounded-3xl border border-sand bg-sand/30 p-6 sm:p-8 text-center space-y-4">
        <h2 className="font-serif text-2xl font-bold text-ink">Ready to explore outside?</h2>
        <p className="mx-auto max-w-lg text-sm text-ink-muted">
          Your daily quest is waiting. Ten minutes of fresh air, three things to notice, and hours reclaimed.
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Button asChild className="rounded-xl px-5 py-2.5 font-bold shadow-paper">
            <Link to="/quest"><Footprints className="size-4 mr-1.5" /> Start Today's Quest</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-xl border-sand bg-paper-raised px-5 py-2.5 font-semibold text-ink shadow-paper">
            <Link to="/passport" search={{ tab: "rewards" }}><Gift className="size-4 mr-1.5 text-stamp" /> View Rewards</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
