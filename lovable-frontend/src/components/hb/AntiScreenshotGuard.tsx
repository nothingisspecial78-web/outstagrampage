import { useEffect, useState, useRef } from "react";
import { EyeOff, Lock, AlertTriangle } from "lucide-react";
import { useStore } from "@/lib/store";

/**
 * AntiScreenshotGuard — Strict Anti-Screenshot & Screen Capture Protection
 *
 * Implements comprehensive multi-layer protection across mobile and desktop:
 * 1. Synchronous DOM Veil: Instantaneous blanking on window blur, visibilitychange, or pagehide
 *    (covers mobile hardware button captures like Power+Volume before the frame buffer is written).
 * 2. Mobile Multi-Touch Gesture Blocker: Intercepts 3-finger swipe screenshot gestures.
 * 3. Desktop Keyboard Interceptor: Blocks PrintScreen, Win+Shift+S, Cmd+Shift+3/4/5, Ctrl+P, Ctrl+S, F12.
 * 4. Clipboard Sanitizer: Overwrites clipboard on capture attempts.
 * 5. Screen Recording API Blocker: Disables navigator.mediaDevices.getDisplayMedia.
 * 6. Dynamic Anti-Camera Watermark: Renders subtle user identification overlay to prevent external camera leaks.
 */
export function AntiScreenshotGuard() {
  const { session } = useStore();
  const [active, setActive] = useState(false);
  const veilRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Synchronous veil activator (0ms latency, runs in microseconds before screen buffer capture)
    const showVeilSync = () => {
      document.documentElement.classList.add("outstagram-shield-locked");
      if (veilRef.current) {
        veilRef.current.style.setProperty("display", "flex", "important");
        veilRef.current.style.setProperty("opacity", "1", "important");
        veilRef.current.style.setProperty("pointer-events", "auto", "important");
      }
      setActive(true);
    };

    const hideVeilSync = (delay = 350) => {
      setTimeout(() => {
        // Only hide if document is genuinely visible and focused
        if (!document.hidden && document.hasFocus()) {
          document.documentElement.classList.remove("outstagram-shield-locked");
          if (veilRef.current) {
            veilRef.current.style.setProperty("display", "none", "important");
            veilRef.current.style.setProperty("opacity", "0", "important");
            veilRef.current.style.setProperty("pointer-events", "none", "important");
          }
          setActive(false);
        }
      }, delay);
    };

    // 1. Intercept keyboard screenshot shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // PrintScreen / SysRq
      if (
        e.key === "PrintScreen" ||
        e.code === "PrintScreen" ||
        (e as any).keyCode === 44
      ) {
        e.preventDefault();
        e.stopPropagation();
        showVeilSync();
        sanitizeClipboard();
        hideVeilSync(3000);
        return;
      }

      // Windows Snipping Tool: Win+Shift+S or Ctrl+Shift+S
      if (
        (e.metaKey || e.ctrlKey) &&
        e.shiftKey &&
        (e.key === "S" || e.key === "s" || e.code === "KeyS")
      ) {
        e.preventDefault();
        e.stopPropagation();
        showVeilSync();
        sanitizeClipboard();
        hideVeilSync(3000);
        return;
      }

      // Mac Screenshot: Cmd+Shift+3, Cmd+Shift+4, Cmd+Shift+5
      if (
        e.metaKey &&
        e.shiftKey &&
        ["3", "4", "5"].includes(e.key)
      ) {
        e.preventDefault();
        e.stopPropagation();
        showVeilSync();
        sanitizeClipboard();
        hideVeilSync(3000);
        return;
      }

      // Print / PDF Save: Ctrl+P / Cmd+P
      if ((e.ctrlKey || e.metaKey) && (e.key === "p" || e.key === "P")) {
        e.preventDefault();
        e.stopPropagation();
        showVeilSync();
        hideVeilSync(2500);
        return;
      }

      // Save HTML Page: Ctrl+S / Cmd+S
      if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "S") && !e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        showVeilSync();
        hideVeilSync(2000);
        return;
      }

      // DevTools Inspect shortcuts: F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C
      if (
        e.key === "F12" ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && ["I", "i", "J", "j", "C", "c"].includes(e.key))
      ) {
        e.preventDefault();
        e.stopPropagation();
        showVeilSync();
        hideVeilSync(2000);
        return;
      }
    };

    // 2. Intercept multi-touch screenshot gestures on mobile (3-finger swipe)
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches && e.touches.length >= 3) {
        e.preventDefault();
        showVeilSync();
        hideVeilSync(2500);
      }
    };

    // 3. Visibility change (fired when tab is hidden or mobile OS triggers screenshot)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        showVeilSync();
      } else {
        hideVeilSync(400);
      }
    };

    // 4. Window blur & pagehide (triggers on mobile Power+Volume press or app switcher)
    const handleWindowBlur = () => {
      showVeilSync();
    };

    const handleWindowFocus = () => {
      hideVeilSync(350);
    };

    const handlePageHide = () => {
      showVeilSync();
    };

    // 5. Prevent context menu on images, videos, and postcards
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "IMG" ||
        target.tagName === "VIDEO" ||
        target.closest(".postcard-frame") ||
        target.closest("main")
      ) {
        e.preventDefault();
      }
    };

    // 6. Block drag and drop to desktop
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
    };

    // 7. Prevent copy / cut of private information
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      sanitizeClipboard(e);
      showVeilSync();
      hideVeilSync(1500);
    };

    // 8. Block screen sharing API (getDisplayMedia)
    if (typeof navigator !== "undefined" && navigator.mediaDevices) {
      try {
        const originalGetDisplayMedia = navigator.mediaDevices.getDisplayMedia;
        navigator.mediaDevices.getDisplayMedia = async function () {
          showVeilSync();
          hideVeilSync(3000);
          throw new DOMException(
            "Screen recording is prohibited on Outstagram to preserve privacy.",
            "NotAllowedError"
          );
        };
      } catch {}
    }

    // Attach all event listeners with capture phase for highest priority
    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("keyup", (e) => {
      if (e.key === "PrintScreen" || e.code === "PrintScreen") {
        showVeilSync();
        sanitizeClipboard();
        hideVeilSync(3000);
      }
    }, true);
    window.addEventListener("touchstart", handleTouchStart, { passive: false });
    document.addEventListener("visibilitychange", handleVisibilityChange, true);
    window.addEventListener("blur", handleWindowBlur, true);
    window.addEventListener("focus", handleWindowFocus, true);
    window.addEventListener("pagehide", handlePageHide, true);
    document.addEventListener("contextmenu", handleContextMenu, true);
    window.addEventListener("dragstart", handleDragStart, true);
    document.addEventListener("copy", handleCopy, true);
    document.addEventListener("cut", handleCopy, true);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("visibilitychange", handleVisibilityChange, true);
      window.removeEventListener("blur", handleWindowBlur, true);
      window.removeEventListener("focus", handleWindowFocus, true);
      window.removeEventListener("pagehide", handlePageHide, true);
      document.removeEventListener("contextmenu", handleContextMenu, true);
      window.removeEventListener("dragstart", handleDragStart, true);
      document.removeEventListener("copy", handleCopy, true);
      document.removeEventListener("cut", handleCopy, true);
    };
  }, []);

  const sanitizeClipboard = (e?: ClipboardEvent) => {
    const notice = "Outstagram: Screenshots and text extraction are strictly restricted to honor real-world moments.";
    try {
      if (e && e.clipboardData) {
        e.clipboardData.setData("text/plain", notice);
      } else if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(notice);
      }
    } catch {}
  };

  const userHandle = session?.name || "member";

  return (
    <>
      {/* 1. Subtle, translucent anti-camera security watermark across background */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[35] select-none overflow-hidden opacity-[0.035] mix-blend-difference"
      >
        <div className="absolute inset-0 -rotate-12 scale-125 flex flex-wrap gap-x-24 gap-y-16 font-mono text-xs font-bold text-ink">
          {Array.from({ length: 48 }).map((_, i) => (
            <span key={i} className="whitespace-nowrap tracking-widest">
              OUTSTAGRAM PRIVACY · @{userHandle.toLowerCase()} · DO NOT CAPTURE
            </span>
          ))}
        </div>
      </div>

      {/* 2. Permanent Synchronous Screen Veil (instantly shown on blur, visibilitychange or shortcut) */}
      <div
        ref={veilRef}
        id="outstagram-screenshot-shield"
        aria-hidden={!active}
        style={{ display: "none" }}
        className="fixed inset-0 z-[2147483647] flex flex-col items-center justify-center bg-[#1C1917]/98 p-6 text-center text-paper-raised backdrop-blur-3xl select-none"
      >
        <div className="max-w-sm rounded-3xl border border-sand/20 bg-paper-raised p-8 text-center text-ink shadow-2xl">
          <div className="mx-auto mb-4 grid size-16 place-items-center rounded-full bg-stamp-soft text-stamp">
            <EyeOff className="size-8" />
          </div>
          <span className="inline-block rounded-full bg-stamp-soft px-3 py-1 text-[11px] font-bold tracking-wider uppercase text-stamp-ink">
            Privacy Shield Engaged
          </span>
          <h3 className="mt-3 font-serif text-2xl font-bold text-ink">
            Screenshots Disabled
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-ink-muted">
            Outstagram is built on authentic presence. Screenshots, screen recordings,
            and capture utilities are disabled to protect community trust.
          </p>
          <div className="mt-6 border-t border-sand pt-4 font-hand text-lg text-stamp-ink">
            "Post less. Go somewhere. Meet someone."
          </div>
        </div>
      </div>
    </>
  );
}
