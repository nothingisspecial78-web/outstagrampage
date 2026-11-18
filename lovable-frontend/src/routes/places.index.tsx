import { Store, MapPin, Info, Calendar, ArrowRight } from "lucide-react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useStore, PLACES_INFO } from "@/lib/store";
import { Postmark } from "@/components/hb/Postmark";

export const Route = createFileRoute("/places/")({
  head: () => ({
    meta: [
      { title: "Places & Community Bulletin — Outstagram" },
      { name: "description", content: "Local places near you, calm offers that come with a stamp, and the local community noticeboard." },
      { property: "og:title", content: "Places & Community Bulletin — Outstagram" },
      { property: "og:description", content: "Go somewhere. Show your stamp. Read local community notices." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Places,
});

const NOTICES = [
  {
    title: "Botanical Watercolor & Seed Exchange",
    place: "Old Greenhouse",
    time: "Saturday 10:00 AM",
    badge: "Craft Workshop",
  },
  {
    title: "Used Poetry & Atlas Night",
    place: "Remparts Books",
    time: "Tuesday 6:30 PM",
    badge: "Book Swap",
  },
  {
    title: "Acoustic Folk by the Water",
    place: "West Pier",
    time: "Friday Golden Hour",
    badge: "Gathering",
  },
];

function Places() {
  const { offers, stamps } = useStore();

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <header className="flex items-center gap-4">
        <span className="grid size-14 place-items-center rounded-2xl bg-gradient-hero text-primary-foreground shadow-postcard">
          <Store className="size-7" />
        </span>
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Places nearby</h1>
          <p className="text-sm text-ink-muted">Go somewhere. Show your stamp.</p>
        </div>
      </header>

      {/* Community Bulletin / Ads as Information noticeboard */}
      <section className="rounded-2xl border border-sand bg-paper-raised p-5 shadow-paper">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="size-4 text-stamp-ink" />
            <h2 className="font-serif text-base font-bold text-ink">Community Bulletin (Ads as Information)</h2>
          </div>
          <Link to="/passport" className="text-xs font-semibold text-stamp-ink hover:underline">
            All notices →
          </Link>
        </div>
        <p className="mt-1 text-xs text-ink-muted">
          Static notices from local neighbors and makers. No tracking pixels, zero algorithmic targeting.
        </p>

        <div className="mt-3 divide-y divide-line">
          {NOTICES.map((n, idx) => (
            <div key={idx} className="flex items-center justify-between py-2.5">
              <div>
                <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-stamp-ink bg-stamp-soft/60 px-1.5 py-0.5 rounded">
                  {n.badge}
                </span>
                <p className="font-semibold text-sm text-ink mt-0.5">{n.title}</p>
                <p className="text-xs text-ink-muted">{n.place} · {n.time}</p>
              </div>
              <Postmark place={n.place} date="INFO" tone="moss" className="size-11 shrink-0" />
            </div>
          ))}
        </div>
      </section>

      {/* Places grid */}
      <div>
        <h2 className="font-serif text-lg font-bold text-ink mb-3">Independent Local Spots</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {PLACES_INFO.map((p) => {
            const n = offers.filter((o) => o.place === p.name && o.status === "live").length;
            const has = stamps.some((s) => s.label === p.name);
            return (
              <li key={p.id}>
                <Link
                  to="/places/$id"
                  params={{ id: p.id }}
                  className="rounded-2xl border border-sand bg-paper-raised shadow-paper flex items-center gap-3 p-4 transition-transform hover:-translate-y-0.5"
                >
                  <span className="grid size-10 place-items-center rounded-xl bg-stamp-soft text-stamp-ink">
                    <MapPin className="size-5" />
                  </span>
                  <div className="flex-1">
                    <p className="font-semibold text-ink">{p.name}</p>
                    <p className="text-xs text-ink-muted">
                      {has ? "You've been here" : "Not visited yet"}
                      {n ? " · offer" : ""}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
