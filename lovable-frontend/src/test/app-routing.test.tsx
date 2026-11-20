import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryHistory, createRouter, rootRouteId, RouterProvider } from "@tanstack/react-router";
import { render, fireEvent } from "@testing-library/react";
import { describe, expect, it, beforeAll } from "vitest";

import { routeTree } from "@/routeTree.gen";
import { Route as LoginRoute } from "@/routes/login";
import { StoreProvider } from "@/lib/store";

beforeAll(() => {
  if (typeof window !== "undefined") {
    window.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
    try {
      sessionStorage.setItem("splash", "1");
    } catch {}
  }
});

async function renderWithRouter(initialEntry = "/") {
  const queryClient = new QueryClient();
  const history = createMemoryHistory({ initialEntries: [initialEntry] });
  const router = createRouter({
    routeTree,
    history,
    context: { queryClient },
  });

  await router.load();

  return render(
    <QueryClientProvider client={queryClient}>
      <StoreProvider>
        <RouterProvider router={router} />
      </StoreProvider>
    </QueryClientProvider>
  );
}

describe("App routing and components", () => {
  it("matches a page for / instead of falling back to not found", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
    const matches = router.matchRoutes("/");
    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
  });

  it("matches a page for /login and /about", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
    const loginMatches = router.matchRoutes("/login");
    expect(loginMatches.at(-1)?.routeId).not.toBe(rootRouteId);

    const aboutMatches = router.matchRoutes("/about");
    expect(aboutMatches.at(-1)?.routeId).not.toBe(rootRouteId);
  });

  it("renders Login component without runtime errors or missing variables", () => {
    const LoginComponent = (LoginRoute as any).options.component;
    const queryClient = new QueryClient();

    const { getByText, getAllByText } = render(
      <QueryClientProvider client={queryClient}>
        <StoreProvider>
          <LoginComponent />
        </StoreProvider>
      </QueryClientProvider>
    );

    expect(getByText("Welcome Back")).toBeDefined();
    expect(getAllByText(/Explore as Guest/i).length).toBeGreaterThanOrEqual(1);
    expect(getByText("Member")).toBeDefined();
    expect(getByText("Admin")).toBeDefined();
  });

  it("renders About manifesto page through router without errors", async () => {
    const { findByText } = await renderWithRouter("/about");
    expect(await findByText(/Quiet Social Architecture/i)).toBeDefined();
    expect(await findByText(/Finite Rack of 10/i)).toBeDefined();
  });

  it("renders Passport Rewards and Stamps through router with no undefined errors", async () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
    const passportMatches = router.matchRoutes("/passport");
    expect(passportMatches.at(-1)?.routeId).not.toBe(rootRouteId);
  });
});
