import { useState } from "react";
import {
  Plane,
  Glasses,
  Train,
  BookOpen,
  TreePine,
  Coffee,
  Ticket,
  Check,
  Copy,
  Sparkles,
  QrCode,
  Calendar,
  MapPin,
  Clock,
  ArrowRight,
  ShieldCheck,
  Award,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export type TicketVoucher = {
  id: string;
  category: "flight" | "eyewear" | "rail" | "books" | "nature" | "cafe";
  partner: string;
  title: string;
  rewardDesc: string;
  challengeType: "steps" | "pages" | "meetups" | "stamps";
  targetAmount: number;
  unit: string;
  pointsPrice: number;
  badge: string;
  tagline: string;
  tone: "stamp" | "moss" | "sky" | "amber";
  voucherCode: string;
  validity: string;
  instructions: string;
  heroImg: string;
};

export const TICKET_PASSES: TicketVoucher[] = [
  {
    id: "flight-50",
    category: "flight",
    partner: "Star Air & Explorer Flights",
    title: "50% Off Domestic Flight Ticket",
    rewardDesc: "Unplug from feeds and take a real-world journey. Walk 50,000 steps outdoors to receive half-price domestic flights.",
    challengeType: "steps",
    targetAmount: 50000,
    unit: "steps outdoors",
    pointsPrice: 3500,
    badge: "Air Travel Partner · Boarding Voucher",
    tagline: "Post less. Fly somewhere you've never been.",
    tone: "sky",
    voucherCode: "OUT-FLIGHT-50-WNDR",
    validity: "Valid for 6 months across all domestic routes",
    instructions: "Enter voucher code during partner airline checkout or present this digital pass at any airport ticket counter.",
    heroImg: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&auto=format&fit=crop&q=80",
  },
  {
    id: "lenskart-frame",
    category: "eyewear",
    partner: "Lenskart Optical Works",
    title: "Complimentary Handcrafted Acetate Frame",
    rewardDesc: "Walk 20,000 steps without opening algorithmic feeds. Claim a free premium acetate optical frame at any neighborhood store.",
    challengeType: "steps",
    targetAmount: 20000,
    unit: "steps walked",
    pointsPrice: 1200,
    badge: "Community Partner · Physical Eyewear",
    tagline: "Rest your screen-weary eyes. See the neighborhood clearly.",
    tone: "stamp",
    voucherCode: "LK-OUT-20K-VISION",
    validity: "Redeemable at 1,200+ physical neighborhood stores",
    instructions: "Walk into any official Lenskart store and present this barcode pass to the optician.",
    heroImg: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&auto=format&fit=crop&q=80",
  },
  {
    id: "scenic-rail",
    category: "rail",
    partner: "Metropolitan High-Speed Scenic Rail",
    title: "Free Weekend Coast-to-Mountain Rail Pass",
    rewardDesc: "Leave the city behind. Complete 30,000 steps to unlock a complimentary weekend roundtrip on scenic passenger rails.",
    challengeType: "steps",
    targetAmount: 30000,
    unit: "steps outdoors",
    pointsPrice: 2200,
    badge: "Transit Partner · Rail Ticket",
    tagline: "Watch rolling green hills through the train window.",
    tone: "moss",
    voucherCode: "RAIL-PASS-OUT-889",
    validity: "Valid on all regional weekend rail services",
    instructions: "Scan the barcode at the automatic platform gates or hand to the train conductor.",
    heroImg: "https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=800&auto=format&fit=crop&q=80",
  },
  {
    id: "remparts-books",
    category: "books",
    partner: "Remparts Books & Indie Guild",
    title: "Free Hardcover Book + Lit Fest Entry",
    rewardDesc: "Read 500 pages offline. Bring your reading journal to Remparts Books to pick any hardcover book on the house.",
    challengeType: "pages",
    targetAmount: 500,
    unit: "pages read",
    pointsPrice: 1500,
    badge: "Indie Bookstore · Literature Pass",
    tagline: "Touch the paper. Turn the page. Finish the chapter.",
    tone: "amber",
    voucherCode: "INDIE-READ-500-BOOK",
    validity: "Valid anytime during store open hours",
    instructions: "Present this pass to the shopkeeper at Remparts Books counter.",
    heroImg: "https://images.unsplash.com/photo-1507842229452-9442004d496c?w=800&auto=format&fit=crop&q=80",
  },
  {
    id: "old-greenhouse",
    category: "nature",
    partner: "Old Greenhouse & Botanical Trust",
    title: "Weekend Botanical Sanctuary Pass + Heirloom Cutting",
    rewardDesc: "Visit 3 different local green spaces or gardens. Enjoy unlimited entry plus a live botanical cutting jar.",
    challengeType: "stamps",
    targetAmount: 3,
    unit: "green spaces visited",
    pointsPrice: 1800,
    badge: "Nature Trust · Sanctuary Ticket",
    tagline: "Breathe oxygen in ancient humid glasshouses.",
    tone: "moss",
    voucherCode: "NATURE-PASS-BOTANIC-44",
    validity: "Valid throughout the current season",
    instructions: "Show this digital ticket at the front conservatory gates.",
    heroImg: "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=800&auto=format&fit=crop&q=80",
  },
  {
    id: "riverside-coffee",
    category: "cafe",
    partner: "Riverside Cafe & Specialty Roastery",
    title: "Month of Complimentary Hand-Drip Pour-Overs",
    rewardDesc: "Meet 2 friends in person for phone-free coffee. Unlocks a complimentary artisanal hand-poured single-origin brew.",
    challengeType: "meetups",
    targetAmount: 2,
    unit: "in-person meetups",
    pointsPrice: 800,
    badge: "Local Roaster · Cafe Pass",
    tagline: "Freshly roasted Ethiopian and Colombian beans.",
    tone: "stamp",
    voucherCode: "ROAST-OUT-POUR-711",
    validity: "Valid for 30 days from unlock",
    instructions: "Show pass to the barista before placing your coffee order.",
    heroImg: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&auto=format&fit=crop&q=80",
  },
];

export function getIconForCategory(cat: TicketVoucher["category"]) {
  switch (cat) {
    case "flight":
      return Plane;
    case "eyewear":
      return Glasses;
    case "rail":
      return Train;
    case "books":
      return BookOpen;
    case "nature":
      return TreePine;
    case "cafe":
      return Coffee;
  }
}

/**
 * DigitalTicketModal
 * Renders an authentic vintage perforated boarding pass / ticket stub
 */
export function DigitalTicketModal({
  ticket,
  onClose,
  userName = "Sam",
}: {
  ticket: TicketVoucher | null;
  onClose: () => void;
  userName?: string;
}) {
  const [copied, setCopied] = useState(false);
  if (!ticket) return null;

  const Icon = getIconForCategory(ticket.category);

  const handleCopy = () => {
    try {
      navigator.clipboard.writeText(ticket.voucherCode);
      setCopied(true);
      toast.success("Voucher code copied to clipboard!");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.info(`Pass code: ${ticket.voucherCode}`);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl border-0 bg-transparent p-0 shadow-none">
        {/* Ticket Container */}
        <div className="relative overflow-hidden rounded-3xl border-2 border-dashed border-sand bg-paper p-6 shadow-2xl sm:p-8">
          {/* Top Notch Cutouts */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 size-8 rounded-full bg-stone-900 border-b border-sand hidden sm:block" />
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-sand pb-4">
            <div className="flex items-center gap-3">
              <span className="grid size-12 place-items-center rounded-2xl bg-stamp-soft text-stamp shadow-sm">
                <Icon className="size-6" />
              </span>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-stamp-ink">
                  {ticket.badge}
                </span>
                <h2 className="font-serif text-xl font-bold text-ink sm:text-2xl">{ticket.title}</h2>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 self-start sm:self-auto rounded-full bg-moss/10 px-3 py-1 text-xs font-bold text-moss">
              <Check className="size-3.5" /> Official Voucher
            </span>
          </div>

          {/* Ticket Body: Passenger details & route */}
          <div className="my-6 grid grid-cols-2 gap-4 rounded-2xl bg-paper-raised p-4 border border-sand/60 sm:grid-cols-4">
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-ink-muted">Recipient</span>
              <span className="font-serif text-base font-bold text-ink">{userName}</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-ink-muted">Partner</span>
              <span className="text-xs font-semibold text-ink line-clamp-1">{ticket.partner}</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-ink-muted">Pass ID</span>
              <span className="font-mono text-xs font-bold text-stamp">{ticket.voucherCode.split("-").slice(0, 3).join("-")}</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-ink-muted">Status</span>
              <span className="text-xs font-bold text-emerald-600">Active & Ready</span>
            </div>
          </div>

          {/* Perforated Divider */}
          <div className="relative my-6 flex items-center justify-between">
            <div className="size-6 -ml-9 rounded-full bg-stone-900" />
            <div className="w-full border-b-2 border-dashed border-sand/80" />
            <div className="size-6 -mr-9 rounded-full bg-stone-900" />
          </div>

          {/* Barcode & Voucher Code Block */}
          <div className="flex flex-col items-center justify-center rounded-2xl border border-sand bg-paper p-5 text-center shadow-inner">
            <span className="text-xs text-ink-muted">Official Digital Pass Code</span>
            <div className="my-2 select-all rounded-xl border border-stamp/40 bg-stamp-soft/50 px-5 py-2 font-mono text-xl font-bold tracking-wider text-stamp-ink">
              {ticket.voucherCode}
            </div>

            {/* Stylized Barcode Graphic */}
            <div className="my-2 flex h-10 items-end justify-center gap-1 opacity-85">
              {[4, 2, 6, 3, 7, 2, 5, 8, 3, 6, 2, 7, 4, 3, 6, 8, 3, 5, 2, 7, 4, 6].map((h, i) => (
                <div key={i} className="w-1 bg-ink rounded-full" style={{ height: `${h * 11}%` }} />
              ))}
            </div>

            <p className="mt-2 text-[11px] text-ink-muted max-w-sm">
              {ticket.instructions}
            </p>
          </div>

          {/* Validity & Actions */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-2 text-xs text-ink-muted">
              <Calendar className="size-4 text-stamp" />
              <span>{ticket.validity}</span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={handleCopy}
                className="flex-1 sm:flex-initial border-sand hover:bg-line text-xs font-semibold"
              >
                {copied ? <Check className="size-3.5 mr-1 text-moss" /> : <Copy className="size-3.5 mr-1" />}
                {copied ? "Copied" : "Copy Code"}
              </Button>
              <Button
                onClick={() => {
                  toast.success("Pass confirmed! Have a wonderful offline experience.");
                  onClose();
                }}
                className="flex-1 sm:flex-initial bg-stamp text-primary-foreground text-xs font-semibold"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
