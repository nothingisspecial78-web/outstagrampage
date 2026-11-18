import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { MapPin, ArrowLeft, Check, UserPlus, Camera, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { CharCount, Avatar } from "@/components/hb/AppShell";
import { Postmark } from "@/components/hb/Postmark";
import { captionValid, useStore } from "@/lib/store";
import { ME, PEOPLE } from "@/lib/people";
import { cn } from "@/lib/utils";
import cafe from "@/assets/pc-cafe.jpg";
import { submitPostcard } from "@/lib/api";

export const Route = createFileRoute("/capture")({
  head: () => ({
    meta: [
      { title: "Create — Outstagram" },
      { name: "description", content: "Take one live photo where you are. No gallery uploads." },
      { property: "og:title", content: "Create — Outstagram" },
      { property: "og:description", content: "Only from where you stand." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Capture,
});

const FILTERS = [
  ["Normal", ""],
  ["Clarendon", "contrast(1.2) saturate(1.35)"],
  ["Vintage", "sepia(.45) contrast(.95) brightness(1.05)"],
  ["Warm", "saturate(1.2) hue-rotate(-12deg) brightness(1.05)"],
  ["Moss", "saturate(.8) hue-rotate(20deg)"],
] as const;

const PLACES = ["Riverside Cafe", "West Pier", "Linden Park", "Remparts Books"];

function imageToJpegBase64(imgUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.naturalWidth || 800;
      c.height = img.naturalHeight || 600;
      const ctx = c.getContext("2d");
      ctx?.drawImage(img, 0, 0);
      resolve(c.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => resolve(imgUrl);
    img.src = imgUrl;
  });
}

function Capture() {
  const [step, setStep] = useState<"cam" | "edit" | "done">("cam");
  const [flash, setFlash] = useState(false);
  const [filter, setFilter] = useState(0);
  const [caption, setCaption] = useState("");
  const [place, setPlace] = useState(PLACES[0]!);
  const [tags, setTags] = useState<string[]>([]);
  const [capturedPhoto, setCapturedPhoto] = useState<string>(cafe);
  const [hasCamera, setHasCamera] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: 12.9716, lng: 77.5946 });
  const [distanceText, setDistanceText] = useState("45m");

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const { demo, addPostcard } = useStore();
  const f = FILTERS[filter]?.[1] ?? "";

  // Handle live camera and geolocation initialization
  useEffect(() => {
    let mounted = true;

    // Geolocation
    if (demo) {
      setCoords({ lat: 12.9716, lng: 77.5946 });
      setDistanceText("45m");
    } else if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (mounted) {
            setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            setDistanceText(`${Math.round(pos.coords.accuracy || 35)}m`);
          }
        },
        () => {
          if (mounted) setDistanceText("45m");
        },
        { timeout: 4000 }
      );
    }

    // Camera stream
    if (step === "cam" && typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 960 } },
          audio: false,
        })
        .then((stream) => {
          if (!mounted) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(() => {});
          }
          setHasCamera(true);
        })
        .catch(() => {
          if (mounted) setHasCamera(false);
        });
    }

    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [step, demo]);

  const snap = async () => {
    setFlash(true);

    let photoData = cafe;
    if (hasCamera && videoRef.current) {
      try {
        const v = videoRef.current;
        const c = document.createElement("canvas");
        c.width = v.videoWidth || 640;
        c.height = v.videoHeight || 480;
        const ctx = c.getContext("2d");
        if (ctx) {
          ctx.drawImage(v, 0, 0, c.width, c.height);
          photoData = c.toDataURL("image/jpeg", 0.88);
        }
      } catch (err) {
        console.warn("Camera canvas capture fallback:", err);
      }
    } else {
      photoData = await imageToJpegBase64(cafe);
    }

    // Stop camera once captured
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    setCapturedPhoto(photoData);

    setTimeout(() => {
      setFlash(false);
      setStep("edit");
    }, 180);
  };

  const share = async () => {
    if (submitting) return;
    setSubmitting(true);

    try {
      const res = await submitPostcard({
        place_id: place,
        caption: caption.trim(),
        lat: coords.lat,
        lng: coords.lng,
        accuracy_m: 20,
        image_base64: capturedPhoto,
        demo_mode: demo,
      });

      addPostcard({
        id: res.postcard_id || crypto.randomUUID(),
        from: ME.name,
        place,
        date: "TODAY",
        img: capturedPhoto,
        caption: caption.trim(),
      });

      toast.success("Shared! A place stamp is in your passport.");
      setStep("done");
    } catch (err: any) {
      toast.error(err.message || "Failed to publish postcard");
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setStep("cam");
    setCaption("");
    setFilter(0);
    setTags([]);
    setCapturedPhoto(cafe);
  };

  if (step === "cam")
    return (
      <div className="mx-auto max-w-md">
        <div className="relative overflow-hidden rounded-3xl bg-ink shadow-postcard">
          {hasCamera ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="aspect-[3/4] w-full object-cover"
            />
          ) : (
            <img
              src={cafe}
              alt="Live camera view"
              className="aspect-[3/4] w-full object-cover opacity-90"
            />
          )}

          {/* 3x3 Composition grid */}
          <div className="pointer-events-none absolute inset-8 grid grid-cols-3 grid-rows-3 [&>span]:border-paper-raised/20">
            {Array.from({ length: 9 }).map((_, i) => (
              <span key={i} className="border-r border-b" />
            ))}
          </div>

          {/* Location & Proximity Pill */}
          <div className="absolute top-4 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-paper-raised/95 px-3 py-1.5 text-xs font-semibold text-ink shadow-paper">
            <span className="size-2 animate-pulse rounded-full bg-moss" />
            <MapPin className="size-3.5 text-stamp" /> {place} · {distanceText}
          </div>

          {/* Live Badge */}
          <span className="absolute top-5 left-4 flex items-center gap-1 text-[10px] font-bold tracking-widest text-paper-raised">
            <span className="size-2 rounded-full bg-badge" /> LIVE
          </span>

          {/* Camera Status Badge */}
          <span className="absolute top-5 right-4 flex items-center gap-1 text-[10px] font-semibold text-paper-raised/80 bg-ink/50 px-2 py-0.5 rounded-full">
            <Camera className="size-3" /> {hasCamera ? "Camera On" : "Preview"}
          </span>

          {flash && <div className="absolute inset-0 bg-paper-raised" />}

          {/* Shutter Button */}
          <div className="absolute inset-x-0 bottom-6 flex justify-center">
            <button
              onClick={snap}
              aria-label="Take photo"
              className="grid size-20 place-items-center rounded-full border-4 border-paper-raised transition-transform active:scale-90 focus:outline-none"
            >
              <span className="size-14 rounded-full bg-paper-raised" />
            </button>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-ink-muted">
          No gallery uploads. Outstagram only takes what's in front of you.
        </p>
      </div>
    );

  if (step === "done")
    return (
      <div className="paper-card animate-rise mx-auto max-w-md p-8 text-center">
        <div className="relative mx-auto w-56">
          <img
            src={capturedPhoto}
            alt=""
            style={{ filter: f }}
            className="aspect-square w-full rounded-xl object-cover"
          />
          <Postmark place={place} date="TODAY" className="absolute -top-4 -right-4 rounded-full bg-paper-raised/90" />
        </div>
        <h1 className="mt-6 flex items-center justify-center gap-2 text-2xl font-extrabold text-ink">
          <Check className="size-6 text-moss" /> Your post has been shared
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          That's your one post for today. Now enjoy {place}.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Link to="/" className="rounded-xl bg-stamp px-4 py-2.5 text-sm font-semibold text-primary-foreground">
            Back to feed
          </Link>
          <Link to="/passport" className="rounded-xl bg-line px-4 py-2.5 text-sm font-semibold text-ink">
            See stamp
          </Link>
        </div>
      </div>
    );

  return (
    <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-sand bg-paper-raised shadow-postcard">
      <header className="flex items-center justify-between border-b border-sand px-4 py-3">
        <button onClick={reset} aria-label="Retake" className="text-ink hover:text-stamp">
          <ArrowLeft className="size-6" />
        </button>
        <h1 className="font-semibold text-ink">Create new post</h1>
        <button
          onClick={share}
          disabled={!captionValid(caption) || submitting}
          className="text-sm font-bold text-link disabled:opacity-40"
        >
          {submitting ? "Sharing…" : "Share"}
        </button>
      </header>

      <div className="md:grid md:grid-cols-[1fr_340px]">
        <div>
          <img
            src={capturedPhoto}
            alt="Your photo"
            style={{ filter: f }}
            className="aspect-square w-full object-cover transition-[filter] duration-300"
          />
          <div className="no-scrollbar flex gap-3 overflow-x-auto p-3">
            {FILTERS.map(([n, css], i) => (
              <button key={n} onClick={() => setFilter(i)} className="shrink-0 text-center">
                <img
                  src={capturedPhoto}
                  alt=""
                  style={{ filter: css }}
                  className={cn(
                    "size-16 rounded-lg object-cover ring-offset-2 ring-offset-paper-raised",
                    filter === i && "ring-2 ring-stamp"
                  )}
                />
                <span className={cn("mt-1 block text-xs", filter === i ? "font-bold text-ink" : "text-ink-muted")}>
                  {n}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4 border-t border-sand p-4 md:border-t-0 md:border-l">
          <div className="flex items-center gap-2">
            <Avatar src={ME.avatar} size="size-7" />
            <span className="text-sm font-semibold text-ink">{ME.handle}</span>
          </div>

          <div>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={140}
              rows={5}
              placeholder="Write a caption… (8–140 characters)"
              className="w-full resize-none bg-transparent text-sm text-ink outline-none placeholder:text-ink-muted"
            />
            <div className="flex justify-end">
              <CharCount value={caption} />
            </div>
          </div>

          <div className="border-t border-line pt-3">
            <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-ink">
              <MapPin className="size-4" /> Add location
            </p>
            <div className="flex flex-wrap gap-1.5">
              {PLACES.map((p) => (
                <button
                  key={p}
                  onClick={() => setPlace(p)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-semibold",
                    place === p ? "border-stamp bg-stamp-soft text-stamp-ink" : "border-sand text-ink-muted"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-line pt-3">
            <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-ink">
              <UserPlus className="size-4" /> Tag friends you're with
            </p>
            <div className="flex gap-2">
              {PEOPLE.slice(0, 5).map((p) => (
                <button
                  key={p.handle}
                  onClick={() =>
                    setTags((t) => (t.includes(p.handle) ? t.filter((x) => x !== p.handle) : [...t, p.handle]))
                  }
                  aria-label={p.handle}
                  className={cn(
                    "rounded-full",
                    tags.includes(p.handle) && "ring-2 ring-stamp ring-offset-2 ring-offset-paper-raised"
                  )}
                >
                  <Avatar src={p.avatar} size="size-9" />
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={share}
            disabled={!captionValid(caption) || submitting}
            className="w-full rounded-xl bg-stamp py-3 text-sm font-bold text-primary-foreground transition-opacity disabled:opacity-40"
          >
            {submitting ? "Sharing to today's rack…" : "Share"}
          </button>
        </div>
      </div>
    </div>
  );
}
