import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { StoreProvider } from "@/lib/store";
import { CallProvider } from "@/lib/call/CallContext";
import { CallModal } from "@/components/call/CallModal";
import { IncomingCallDialog } from "@/components/call/IncomingCallDialog";
import { AppShell } from "@/components/hb/AppShell";
import { Splash } from "@/components/hb/Splash";
import { AntiScreenshotGuard } from "@/components/hb/AntiScreenshotGuard";
import { InstallAppBanner } from "@/components/hb/InstallAppBanner";
import { Toaster } from "@/components/ui/sonner";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { useStore } from "@/lib/store";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    // Replace these placeholders with the app's name and description when first building the app.
    // Each content route, / included, must still set its own head(). Never add og:image or
    // twitter:image here: every page without its own would inherit the root's preview image.
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" },
      { title: "Outstagram — Post less. Go somewhere. Meet someone." },
      { name: "description", content: "Outstagram: send, track and deliver real-world moments around your city." },
      { name: "theme-color", content: "#C85A32" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "Outstagram" },
      { name: "application-name", content: "Outstagram" },
      { property: "og:title", content: "Outstagram" },
      { property: "og:description", content: "Post less. Go somewhere. Meet someone." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Caveat:wght@500;700&family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Grand+Hotel&family=Inter:wght@400;500;600;700;800&display=swap" },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "icon", href: "/favicon.ico", sizes: "any" },
      { rel: "apple-touch-icon", href: "/logo-192.png" },
      { rel: "apple-touch-icon", sizes: "192x192", href: "/logo-192.png" },
      { rel: "apple-touch-icon", sizes: "512x512", href: "/logo-512.png" },
      { rel: "shortcut icon", href: "/favicon.ico" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    // Register PWA Service Worker for mobile installation and offline capabilities
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            console.log("Outstagram PWA Service Worker registered:", reg.scope);
          })
          .catch((err) => {
            console.warn("PWA Service Worker registration skipped:", err);
          });
      });
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <StoreProvider>
        <CallProvider>
          <AntiScreenshotGuard />
          <InstallAppBanner />
          <Splash />
          <Shell />
          <CallModal />
          <IncomingCallDialog />
          <Toaster position="top-center" />
        </CallProvider>
      </StoreProvider>
    </QueryClientProvider>
  );
}

function Shell() {
  const path = useLocation({ select: (l) => l.pathname });
  const { session, ready } = useStore();
  const navigate = useNavigate();
  const isPublic = path.startsWith("/login") || path.startsWith("/terms") || path.startsWith("/privacy") || path.startsWith("/about");

  useEffect(() => {
    if (ready && !session && !isPublic) navigate({ to: "/login", replace: true });
  }, [ready, session, isPublic, navigate]);

  if (isPublic) {
    return (
      <div className="min-h-screen bg-paper">
        <Outlet />
      </div>
    );
  }

  if (!ready || !session) return <div className="grid min-h-screen place-items-center bg-paper text-sm text-ink-muted">Opening Outstagram…</div>;

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}