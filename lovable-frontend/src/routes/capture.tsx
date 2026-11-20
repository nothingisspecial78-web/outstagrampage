import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { MapPin, ArrowLeft, Check, UserPlus, Camera, RefreshCw, Square, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { CharCount, Avatar } from "@/components/hb/AppShell";
import { Postmark } from "@/components/hb/Postmark";
import { captionValid, useStore } from "@/lib/store";
import { ME, getCachedRealUsers, type Person } from "@/lib/people";
import { cn } from "@/lib/utils";
import cafe from "@/assets/pc-cafe.jpg";
import { submitPostcard } from "@/lib/api";

export const Route = createFileRoute("/capture")({
  head: () => ({
    meta: [
      { title: "Create — Outstagram" },
      { name: "description", content: "Take one live photo or video where you are. No gallery uploads." },
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
  const [mediaType, setMediaType] = useState<"photo" | "video">("photo");
  const [hasCamera, setHasCamera] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: 12.9716, lng: 77.5946 });
  const [distanceText, setDistanceText] = useState("45m");

  // Camera facing mode: "user" (front/selfie camera) or "environment" (rear camera)
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [isSwitchingCamera, setIsSwitchingCamera] = useState(false);

  // Video recording on hold 2 seconds
  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0); // 0 to 100%
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const holdTimerRef = useRef<any>(null);
  const holdIntervalRef = useRef<any>(null);
  const holdStartTimeRef = useRef<number>(0);
  const recordingTimerRef = useRef<any>(null);
  const isRecordingRef = useRef<boolean>(false);

  const { demo, addPostcard } = useStore();
  const f = FILTERS[filter]?.[1] ?? "";

  // Helper to stop stream
  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

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
      setIsSwitchingCamera(true);
      stopStream();

      // Request video with optional audio for recording
      const getStream = async () => {
        try {
          return await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: facingMode },
              width: { ideal: 1280 },
              height: { ideal: 960 },
            },
            audio: true,
          });
        } catch {
          // If audio request fails, fallback to video-only
          return await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: facingMode },
              width: { ideal: 1280 },
              height: { ideal: 960 },
            },
            audio: false,
          });
        }
      };

      getStream()
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
          setIsSwitchingCamera(false);
        })
        .catch(() => {
          if (mounted) {
            setHasCamera(false);
            setIsSwitchingCamera(false);
          }
        });
    }

    return () => {
      mounted = false;
      stopStream();
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, [step, demo, facingMode]);

  // Toggle front and back camera
  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  // Snap photo
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
          if (facingMode === "user") {
            // Mirror selfie so photo matches preview
            ctx.translate(c.width, 0);
            ctx.scale(-1, 1);
          }
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
    stopStream();

    setCapturedPhoto(photoData);
    setMediaType("photo");

    setTimeout(() => {
      setFlash(false);
      setStep("edit");
    }, 180);
  };

  // Start video recording
  const startVideoRecording = () => {
    if (!streamRef.current || isRecordingRef.current) return;

    try {
      recordedChunksRef.current = [];
      let mimeType = "";
      if (typeof MediaRecorder !== "undefined") {
        const types = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm", "video/mp4"];
        mimeType = types.find((t) => MediaRecorder.isTypeSupported(t)) || "";
      }

      const recorder = new MediaRecorder(streamRef.current, mimeType ? { mimeType } : undefined);

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: mimeType || "video/webm" });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          setCapturedPhoto(base64);
          setMediaType("video");
          setStep("edit");
        };
        reader.readAsDataURL(blob);
        stopStream();
      };

      recorder.start(250);
      mediaRecorderRef.current = recorder;
      isRecordingRef.current = true;
      setIsRecording(true);
      setRecordingSeconds(0);

      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((sec) => {
          if (sec >= 30) {
            stopVideoRecording();
            return 30;
          }
          return sec + 1;
        });
      }, 1000);

      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(100);
      }
      toast.info("Recording video...");
    } catch (err) {
      console.error("Video recording failed to start:", err);
      toast.error("Could not record video");
    }
  };

  // Stop video recording
  const stopVideoRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    isRecordingRef.current = false;
    setIsRecording(false);
    setIsHolding(false);
    setHoldProgress(0);
  };

  // Pointer down on shutter button: hold 2 seconds to automatically record video
  const handlePointerDown = () => {
    if (isRecordingRef.current) {
      stopVideoRecording();
      return;
    }

    setIsHolding(true);
    setHoldProgress(0);
    holdStartTimeRef.current = Date.now();

    // Progress tick over 2000ms
    if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    holdIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - holdStartTimeRef.current;
      const pct = Math.min(100, (elapsed / 2000) * 100);
      setHoldProgress(pct);
    }, 40);

    // 2-second hold threshold triggers video recording automatically
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    holdTimerRef.current = setTimeout(() => {
      if (holdIntervalRef.current) {
        clearInterval(holdIntervalRef.current);
        holdIntervalRef.current = null;
      }
      setHoldProgress(100);
      startVideoRecording();
    }, 2000);
  };

  // Pointer up on shutter button
  const handlePointerUp = () => {
    const elapsed = Date.now() - holdStartTimeRef.current;

    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
    setIsHolding(false);
    setHoldProgress(0);

    if (isRecordingRef.current) {
      stopVideoRecording();
    } else if (elapsed < 2000) {
      // Tap / release under 2s: snap photo
      snap();
    }
  };

  const handlePointerCancel = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
    setIsHolding(false);
    setHoldProgress(0);
    if (isRecordingRef.current) {
      stopVideoRecording();
    }
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
    stopStream();
    setStep("cam");
    setCaption("");
    setFilter(0);
    setTags([]);
    setCapturedPhoto(cafe);
    setMediaType("photo");
    setIsRecording(false);
    setRecordingSeconds(0);
  };

  if (step === "cam")
    return (
      <div className="mx-auto max-w-md select-none">
        <div className="relative overflow-hidden rounded-3xl bg-ink shadow-postcard">
          {hasCamera ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={cn("aspect-[3/4] w-full object-cover", facingMode === "user" && "scale-x-[-1]")}
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
          <div className="absolute top-4 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-paper-raised/95 px-3 py-1.5 text-xs font-semibold text-ink shadow-paper pointer-events-none">
            <span className="size-2 animate-pulse rounded-full bg-moss" />
            <MapPin className="size-3.5 text-stamp" /> {place} · {distanceText}
          </div>

          {/* Live Badge */}
          <span className="absolute top-5 left-4 flex items-center gap-1 text-[10px] font-bold tracking-widest text-paper-raised">
            <span className="size-2 rounded-full bg-badge" /> LIVE
          </span>

          {/* Front / Rear Camera Flip Toggle Button */}
          <button
            type="button"
            onClick={toggleFacingMode}
            aria-label={`Switch camera, currently ${facingMode === "user" ? "front" : "rear"}`}
            className="absolute top-4 right-4 z-20 flex items-center gap-1.5 rounded-full bg-ink/70 backdrop-blur-md px-3 py-1 text-xs font-semibold text-paper-raised hover:bg-ink/90 border border-paper-raised/20 active:scale-95 transition-all cursor-pointer"
          >
            <RefreshCw className={cn("size-3.5 text-stamp", isSwitchingCamera && "animate-spin")} />
            <span>{facingMode === "user" ? "Front (Selfie)" : "Rear"}</span>
          </button>

          {/* Video Recording Indicator Badge */}
          {isRecording && (
            <div className="absolute top-14 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 rounded-full bg-red-600 px-3.5 py-1 text-xs font-bold text-white shadow-lg animate-pulse">
              <span className="size-2.5 rounded-full bg-white animate-ping" />
              <span>REC 00:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds}</span>
            </div>
          )}

          {flash && <div className="absolute inset-0 bg-paper-raised" />}

          {/* Shutter Button with Hold 2-Second Ring & Hint */}
          <div className="absolute inset-x-0 bottom-5 flex flex-col items-center gap-2 z-20">
            <span className="text-[11px] font-medium text-paper-raised/90 bg-ink/60 px-2.5 py-0.5 rounded-full backdrop-blur-sm pointer-events-none">
              {isRecording
                ? "Release or tap to stop recording"
                : isHolding
                ? "Hold for 2s to record video..."
                : "Tap for photo · Hold 2s for video"}
            </span>

            <div className="relative flex items-center justify-center">
              {/* Progress SVG Ring around shutter button */}
              <svg className="size-22 -rotate-90 pointer-events-none" viewBox="0 0 88 88">
                <circle
                  cx="44"
                  cy="44"
                  r="38"
                  fill="none"
                  stroke="rgba(255,255,255,0.25)"
                  strokeWidth="4"
                />
                {(isHolding || isRecording) && (
                  <circle
                    cx="44"
                    cy="44"
                    r="38"
                    fill="none"
                    stroke={isRecording ? "#ef4444" : "var(--color-stamp, #ea580c)"}
                    strokeWidth="5"
                    strokeDasharray={238.76}
                    strokeDashoffset={isRecording ? 0 : 238.76 - (238.76 * holdProgress) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-75"
                  />
                )}
              </svg>

              <button
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerCancel}
                onPointerCancel={handlePointerCancel}
                aria-label={isRecording ? "Stop recording" : "Take photo or hold 2 seconds for video"}
                className={cn(
                  "absolute grid size-16 place-items-center rounded-full transition-transform active:scale-95 focus:outline-none cursor-pointer",
                  isRecording
                    ? "bg-red-600 animate-pulse border-4 border-white"
                    : "border-4 border-paper-raised bg-paper-raised/20"
                )}
              >
                {isRecording ? (
                  <Square className="size-6 text-white fill-current rounded-sm" />
                ) : (
                  <span className="size-12 rounded-full bg-paper-raised" />
                )}
              </button>
            </div>
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
          {mediaType === "video" ? (
            <video
              src={capturedPhoto}
              controls
              autoPlay
              loop
              muted
              playsInline
              className="aspect-square w-full rounded-xl object-cover"
            />
          ) : (
            <img
              src={capturedPhoto}
              alt=""
              style={{ filter: f }}
              className="aspect-square w-full rounded-xl object-cover"
            />
          )}
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
        <button onClick={reset} aria-label="Retake" className="text-ink hover:text-stamp flex items-center gap-1.5 text-sm font-semibold cursor-pointer">
          <RotateCcw className="size-4" /> Retake
        </button>
        <h1 className="font-semibold text-ink">Create new post</h1>
        <button
          type="button"
          onClick={() => {
            if (caption.trim().length < 8) {
              toast.error("Please write at least 8 characters for your reflection.");
              return;
            }
            share();
          }}
          disabled={submitting}
          className="text-sm font-bold text-link hover:underline cursor-pointer"
        >
          {submitting ? "Sharing…" : "Share"}
        </button>
      </header>

      <div className="md:grid md:grid-cols-[1fr_340px]">
        <div>
          {mediaType === "video" ? (
            <video
              src={capturedPhoto}
              controls
              autoPlay
              loop
              playsInline
              className="aspect-square w-full object-cover"
            />
          ) : (
            <>
              <img
                src={capturedPhoto}
                alt="Your photo"
                style={{ filter: f }}
                className="aspect-square w-full object-cover transition-[filter] duration-300"
              />
              <div className="no-scrollbar flex gap-3 overflow-x-auto p-3">
                {FILTERS.map(([n, css], i) => (
                  <button key={n} onClick={() => setFilter(i)} className="shrink-0 text-center cursor-pointer">
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
            </>
          )}
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
                    "rounded-full border px-3 py-1 text-xs font-semibold cursor-pointer",
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
            {getCachedRealUsers().length > 0 ? (
              <div className="flex gap-2">
                {getCachedRealUsers().slice(0, 5).map((p) => (
                  <button
                    key={p.handle}
                    onClick={() =>
                      setTags((t) => (t.includes(p.handle) ? t.filter((x) => x !== p.handle) : [...t, p.handle]))
                    }
                    aria-label={p.handle}
                    className={cn(
                      "rounded-full cursor-pointer",
                      tags.includes(p.handle) && "ring-2 ring-stamp ring-offset-2 ring-offset-paper-raised"
                    )}
                  >
                    <Avatar src={p.avatar} size="size-9" />
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-ink-muted">No friends nearby to tag yet. Connect with members in Messages to tag them in your moments.</p>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              if (caption.trim().length < 8) {
                toast.error("Please write at least 8 characters describing this real-world moment.");
                return;
              }
              share();
            }}
            disabled={submitting}
            className="w-full rounded-xl bg-stamp hover:bg-stamp-ink py-3 text-sm font-bold text-primary-foreground shadow-md transition-all active:scale-98 cursor-pointer"
          >
            {submitting ? "Sharing to today's rack…" : caption.trim().length >= 8 ? "Share to Today's Rack" : "Write at least 8 chars to share"}
          </button>
        </div>
      </div>
    </div>
  );
}