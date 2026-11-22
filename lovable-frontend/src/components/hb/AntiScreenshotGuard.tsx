import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { toast } from "sonner";

/**
 * AntiScreenshotGuard — Safe Anti-Screenshot & Screen Capture Protection
 *
 * Implements privacy protection across mobile and desktop without disrupting user experience:
 * 1. Disables context menu (right click) on photos, videos, and postcards.
 * 2. Prevents drag-and-drop of media.
 * 3. Sanitizes clipboard on copy/cut attempts.
 * 4. Intercepts desktop screenshot key combos (PrintScreen, Win+Shift+S, Cmd+Shift+3/4/5) with friendly non-blocking warning.
 * 5. Blocks screen recorder APIs (navigator.mediaDevices.getDisplayMedia).
 * 6. Subtle, unobtrusive ambient watermark.
 *
 * NOTE: Intentionally avoids full-screen blackout veils or blur filters on mobile touch/blur
 * to guarantee zero black-screen flickering on mobile devices and virtual keyboards.
 */
export function AntiScreenshotGuard() {
  const { session } = useStore();

  useEffect(() => {
    const sanitizeClipboard = (e?: ClipboardEvent) => {
      const notice = "Outstagram: Screenshots and text extraction are restricted to honor real-world moments.";
      try {
        if (e && e.clipboardData) {
          e.clipboardData.setData("text/plain", notice);
        } else if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(notice);
        }
      } catch {}
    };

    // 1. Intercept keyboard screenshot shortcuts cleanly without screen blackout
    const handleKeyDown = (e: KeyboardEvent) => {
      // PrintScreen / SysRq
      if (
        e.key === "PrintScreen" ||
        e.code === "PrintScreen" ||
        (e as any).keyCode === 44
      ) {
        e.preventDefault();
        e.stopPropagation();
        sanitizeClipboard();
        toast.warning("Screenshots are restricted on Outstagram to honor real-world moments.");
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
        sanitizeClipboard();
        toast.warning("Screen capture is restricted on Outstagram.");
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
        sanitizeClipboard();
        toast.warning("Screen capture is restricted on Outstagram.");
        return;
      }

      // Print / PDF Save: Ctrl+P / Cmd+P
      if ((e.ctrlKey || e.metaKey) && (e.key === "p" || e.key === "P")) {
        e.preventDefault();
        e.stopPropagation();
        toast.warning("Printing is restricted to protect member privacy.");
        return;
      }

      // Save HTML Page: Ctrl+S / Cmd+S
      if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "S") && !e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        toast.warning("Saving offline copies is restricted.");
        return;
      }
    };

    // 2. Prevent context menu on images, videos, and postcards
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

    // 3. Block drag and drop of media
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
    };

    // 4. Prevent copy / cut of private information
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      sanitizeClipboard(e);
      toast.info("Outstagram: Content copying is restricted to protect privacy.");
    };

    // 5. Block screen sharing API (getDisplayMedia)
    if (typeof navigator !== "undefined" && navigator.mediaDevices) {
      try {
        navigator.mediaDevices.getDisplayMedia = async function () {
          toast.error("Screen recording is prohibited on Outstagram to preserve privacy.");
          throw new DOMException(
            "Screen recording is prohibited on Outstagram to preserve privacy.",
            "NotAllowedError"
          );
        };
      } catch {}
    }

    // Attach listeners
    window.addEventListener("keydown", handleKeyDown, true);
    document.addEventListener("contextmenu", handleContextMenu, true);
    window.addEventListener("dragstart", handleDragStart, true);
    document.addEventListener("copy", handleCopy, true);
    document.addEventListener("cut", handleCopy, true);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      document.removeEventListener("contextmenu", handleContextMenu, true);
      window.removeEventListener("dragstart", handleDragStart, true);
      document.removeEventListener("copy", handleCopy, true);
      document.removeEventListener("cut", handleCopy, true);
    };
  }, []);

  const userHandle = session?.name || "member";

  return (
    <>
      {/* Subtle, translucent anti-camera security watermark across background */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[35] select-none overflow-hidden opacity-[0.025] mix-blend-difference"
      >
        <div className="absolute inset-0 -rotate-12 scale-125 flex flex-wrap gap-x-24 gap-y-16 font-mono text-[10px] font-bold text-ink">
          {Array.from({ length: 48 }).map((_, i) => (
            <span key={i} className="whitespace-nowrap tracking-widest">
              OUTSTAGRAM PRIVACY · @{userHandle.toLowerCase()} · DO NOT CAPTURE
            </span>
          ))}
        </div>
      </div>
    </>
  );
}
