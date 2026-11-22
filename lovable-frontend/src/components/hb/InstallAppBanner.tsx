import { useState, useEffect } from "react";
import { Download, Smartphone, X, Share2, PlusSquare, CheckCircle, ExternalLink, Sparkles } from "lucide-react";
import { OutstagramIcon } from "./OutstagramLogo";
import { cn } from "@/lib/utils";

// Global holder for PWA deferred prompt
let globalDeferredPrompt: any = null;
let promptListeners: Array<(prompt: any) => void> = [];

export function registerPromptListener(cb: (prompt: any) => void) {
  promptListeners.push(cb);
  if (globalDeferredPrompt) cb(globalDeferredPrompt);
  return () => {
    promptListeners = promptListeners.filter((l) => l !== cb);
  };
}

export function triggerPwaInstall(onShowGuide?: () => void) {
  if (globalDeferredPrompt) {
    globalDeferredPrompt.prompt();
    globalDeferredPrompt.userChoice.then((choiceResult: { outcome: string }) => {
      if (choiceResult.outcome === "accepted") {
        console.log("User accepted Outstagram installation");
      }
      globalDeferredPrompt = null;
      promptListeners.forEach((l) => l(null));
    });
  } else if (onShowGuide) {
    onShowGuide();
  }
}

export function InstallAppBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);

  useEffect(() => {
    // 1. Check if already running in standalone PWA mode
    const standaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes("android-app://");

    setIsStandalone(standaloneMode);

    // 2. Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent) && !(window as any).MSStream;
    setIsIOS(isAppleDevice);

    // 3. Check dismissal memory
    try {
      const dismissedUntil = localStorage.getItem("outstagram_pwa_dismissed");
      if (dismissedUntil && Number(dismissedUntil) > Date.now()) {
        setDismissed(true);
      }
    } catch {}

    // 4. Capture Chrome / Android beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      globalDeferredPrompt = e;
      setDeferredPrompt(e);
      promptListeners.forEach((l) => l(e));
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    const handleAppInstalled = () => {
      console.log("Outstagram app was installed!");
      setIsStandalone(true);
      globalDeferredPrompt = null;
      setDeferredPrompt(null);
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choice: { outcome: string }) => {
        if (choice.outcome === "accepted") {
          setIsStandalone(true);
        }
        setDeferredPrompt(null);
        globalDeferredPrompt = null;
      });
    } else {
      setShowGuideModal(true);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    try {
      // Dismiss for 24 hours
      localStorage.setItem("outstagram_pwa_dismissed", String(Date.now() + 24 * 60 * 60 * 1000));
    } catch {}
  };

  // If already installed or dismissed, only render the guide modal if explicitly opened
  if (isStandalone || (dismissed && !showGuideModal)) {
    return showGuideModal ? (
      <InstallGuideModal isIOS={isIOS} onClose={() => setShowGuideModal(false)} />
    ) : null;
  }

  // Show banner if deferredPrompt is available OR if on mobile browser
  const shouldShowBanner = !dismissed && (deferredPrompt || isIOS);

  return (
    <>
      {shouldShowBanner && (
        <aside
          role="region"
          aria-label="Install Outstagram Mobile App"
          className="fixed bottom-14 md:bottom-4 left-1/2 -translate-x-1/2 z-[70] w-[95%] max-w-lg animate-in slide-in-from-bottom-4 duration-300"
        >
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-stamp/30 bg-paper-raised/98 p-3 shadow-2xl backdrop-blur-md">
            <div className="flex items-center gap-3 min-w-0">
              <OutstagramIcon size={38} className="shrink-0 shadow-xs" />
              <div className="min-w-0">
                <p className="font-serif text-sm font-bold text-ink truncate">
                  Install Outstagram App
                </p>
                <p className="text-xs text-ink-muted truncate">
                  {isIOS
                    ? "Add to home screen for the full offline experience"
                    : "Fast 1-click mobile install · No app store needed"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleInstallClick}
                className="flex items-center gap-1.5 rounded-xl bg-stamp px-3.5 py-2 text-xs font-bold text-primary-foreground shadow-sm hover:bg-stamp/90 transition-transform active:scale-95 cursor-pointer"
              >
                <Download className="size-3.5" />
                <span>{deferredPrompt ? "Install" : "Get App"}</span>
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                aria-label="Dismiss banner"
                className="grid size-8 place-items-center rounded-xl text-ink-muted hover:text-ink hover:bg-sand/40 transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>
        </aside>
      )}

      {showGuideModal && (
        <InstallGuideModal isIOS={isIOS} onClose={() => setShowGuideModal(false)} />
      )}
    </>
  );
}

export function InstallGuideModal({
  isIOS,
  onClose,
}: {
  isIOS: boolean;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[120] grid place-items-center bg-ink/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl border border-sand bg-paper-raised p-6 shadow-postcard">
        <div className="flex items-center justify-between border-b border-sand pb-4">
          <div className="flex items-center gap-2.5">
            <OutstagramIcon size={34} />
            <div>
              <h3 className="font-serif text-lg font-bold text-ink">Install Outstagram App</h3>
              <p className="text-xs text-ink-muted">Install to your mobile home screen</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-8 place-items-center rounded-full text-ink-muted hover:text-ink hover:bg-line cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="my-5 space-y-4 text-sm text-ink">
          {isIOS ? (
            /* iOS Safari Instructions */
            <div className="space-y-3">
              <p className="text-xs font-medium text-ink-muted">
                Follow these 3 simple steps in <b>Safari</b>:
              </p>
              <div className="flex items-start gap-3 rounded-2xl border border-sand bg-paper p-3">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-stamp text-xs font-bold text-white">
                  1
                </span>
                <p className="text-xs leading-relaxed">
                  Tap the <b>Share button</b> (
                  <Share2 className="inline size-3.5 text-stamp mx-0.5" />
                  square with arrow pointing up) at the bottom bar of Safari.
                </p>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-sand bg-paper p-3">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-stamp text-xs font-bold text-white">
                  2
                </span>
                <p className="text-xs leading-relaxed">
                  Scroll down the share sheet and tap <b>"Add to Home Screen"</b> (
                  <PlusSquare className="inline size-3.5 text-stamp mx-0.5" />
                  ).
                </p>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-sand bg-paper p-3">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-stamp text-xs font-bold text-white">
                  3
                </span>
                <p className="text-xs leading-relaxed">
                  Tap <b>"Add"</b> in the top right corner. The Outstagram icon will appear on your phone home screen!
                </p>
              </div>
            </div>
          ) : (
            /* Android / Chrome Instructions */
            <div className="space-y-3">
              <p className="text-xs font-medium text-ink-muted">
                Follow these simple steps in <b>Chrome</b> or your mobile browser:
              </p>
              <div className="flex items-start gap-3 rounded-2xl border border-sand bg-paper p-3">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-stamp text-xs font-bold text-white">
                  1
                </span>
                <p className="text-xs leading-relaxed">
                  Tap the <b>three dots menu (⋮)</b> in the top-right corner of your browser.
                </p>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-sand bg-paper p-3">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-stamp text-xs font-bold text-white">
                  2
                </span>
                <p className="text-xs leading-relaxed">
                  Select <b>"Install app"</b> or <b>"Add to Home Screen"</b>.
                </p>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-sand bg-paper p-3">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-stamp text-xs font-bold text-white">
                  3
                </span>
                <p className="text-xs leading-relaxed">
                  Confirm <b>"Install"</b>. Outstagram will launch as a full native app without the browser address bar!
                </p>
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-2xl bg-stamp py-3 text-sm font-bold text-primary-foreground shadow-postcard transition-transform hover:-translate-y-0.5 cursor-pointer"
        >
          Got it!
        </button>
      </div>
    </div>
  );
}
