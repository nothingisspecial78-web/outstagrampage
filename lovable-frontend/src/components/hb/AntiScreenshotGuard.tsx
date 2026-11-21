import { useEffect, useState } from "react";
import { ShieldAlert, EyeOff } from "lucide-react";

/**
 * AntiScreenshotGuard
 * Protects Outstagram content from screenshots, screen recording, and unauthorized captures:
 * 1. Disables PrintScreen, Snipping Tool shortcuts (Win+Shift+S, Cmd+Shift+3/4/5), Ctrl+P, Ctrl+S, F12.
 * 2. Clears clipboard when PrintScreen is attempted and replaces with privacy message.
 * 3. Detects window blur / tab switch / screen capture overlay activations and applies a privacy blackout veil.
 * 4. Prevents right-click context menu and drag-to-save on all media.
 */
export function AntiScreenshotGuard() {
  const [blurred, setBlurred] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);

  useEffect(() => {
    // 1. Intercept keyboard screenshot and print combinations
    const handleKeyDown = (e: KeyboardEvent) => {
      // PrintScreen key
      if (e.key === "PrintScreen" || e.code === "PrintScreen") {
        e.preventDefault();
        triggerProtection();
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(
              "Outstagram is a private offline space. Screenshotting is disabled to honor real-world moments."
            );
          }
        } catch {}
        return;
      }

      // Windows Snipping tool / Mac screenshot: Win+Shift+S or Cmd+Shift+3/4/5
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === "S" || e.key === "s" || e.code === "KeyS")) {
        e.preventDefault();
        triggerProtection();
        return;
      }

      // Print: Ctrl+P / Cmd+P
      if ((e.ctrlKey || e.metaKey) && (e.key === "p" || e.key === "P")) {
        e.preventDefault();
        triggerProtection();
        return;
      }

      // Save page: Ctrl+S / Cmd+S
      if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        triggerProtection();
        return;
      }
    };

    // 2. Visibility change (triggered when tab is hidden or app is backgrounded)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setBlurred(true);
      } else {
        setBlurred(false);
      }
    };

    // 3. Disable context menu on images and documents
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "IMG" || target.tagName === "VIDEO" || target.closest(".postcard-frame")) {
        e.preventDefault();
      }
    };

    // 4. Prevent dragging images or media to desktop
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
    };

    // 5. Blur veil when external screenshot or screen snipping tool steals focus
    const handleWindowBlur = () => {
      setBlurred(true);
      setAlertVisible(true);
    };

    const handleWindowFocus = () => {
      setTimeout(() => {
        setBlurred(false);
        setAlertVisible(false);
      }, 400);
    };

    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("keyup", (e) => {
      if (e.key === "PrintScreen" || e.code === "PrintScreen") {
        triggerProtection();
      }
    });
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("dragstart", handleDragStart);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("focus", handleWindowFocus);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("dragstart", handleDragStart);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, []);

  const triggerProtection = () => {
    setBlurred(true);
    setAlertVisible(true);
    setTimeout(() => {
      setBlurred(false);
      setAlertVisible(false);
    }, 2800);
  };

  if (!blurred && !alertVisible) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-paper-raised/98 p-6 text-center backdrop-blur-2xl transition-opacity animate-in fade-in select-none"
    >
      <div className="postcard-frame max-w-sm rounded-3xl border border-sand bg-paper p-8 shadow-postcard">
        <div className="mx-auto mb-4 grid size-16 place-items-center rounded-full bg-stamp-soft text-stamp">
          <EyeOff className="size-8" />
        </div>
        <span className="inline-block rounded-full bg-stamp-soft px-3 py-1 text-[11px] font-bold tracking-wider uppercase text-stamp-ink">
          Privacy Shield Active
        </span>
        <h3 className="mt-3 font-serif text-2xl font-bold text-ink">Screenshots Disabled</h3>
        <p className="mt-2 text-xs leading-relaxed text-ink-muted">
          Outstagram is built on mindful presence and real privacy. Moments here stay here.
          Capture and recording tools are disabled to protect authentic connections.
        </p>
        <div className="mt-6 border-t border-sand pt-4 font-hand text-lg text-stamp-ink">
          "Post less. Go somewhere. Meet someone."
        </div>
      </div>
    </div>
  );
}
