// @vitest-environment jsdom
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import OwnerOrders from "./OwnerOrders";

const authState = vi.hoisted(() => ({ user: null as { role: "admin" | "user"; isOwner: boolean } | null, loading: false }));
const setLocation = vi.fn();
const startLogin = vi.hoisted(() => vi.fn());

vi.mock("wouter", () => ({
  Link: ({ children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => <a {...props}>{children}</a>,
  useLocation: () => ["/owner", setLocation],
}));
vi.mock("@/const", () => ({ startLogin }));
vi.mock("@/components/DashboardLayout", () => ({ default: ({ children }: { children: React.ReactNode }) => <section>{children}</section> }));
vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => authState }));
vi.mock("@/contexts/LanguageContext", () => ({ useLanguage: () => ({ language: "ar", isArabic: true }) }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ commerce: { orders: { ownerList: { invalidate: vi.fn() } } } }),
    commerce: {
      orders: {
        ownerList: { useQuery: () => ({ data: [], isLoading: false, isError: false }) },
        updateStatus: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      },
    },
  },
}));

describe("Owner page access", () => {
  beforeEach(() => {
    authState.user = null;
    setLocation.mockReset();
    startLogin.mockReset();
  });

  it("shows an in-app owner sign-in gate without rendering owner orders", () => {
    const view = render(<OwnerOrders />);
    expect(screen.getByRole("heading", { name: "دخول المالكة" })).toBeTruthy();
    expect(view.container.textContent).not.toContain("طلبات المتجر");
    fireEvent.click(screen.getByRole("button", { name: "تسجيل الدخول" }));
    expect(startLogin).toHaveBeenCalledWith("/owner");
    expect(setLocation).not.toHaveBeenCalled();
  });

  it("redirects a signed-in non-owner away without rendering owner content", async () => {
    authState.user = { role: "user", isOwner: false };
    const view = render(<OwnerOrders />);
    await waitFor(() => expect(setLocation).toHaveBeenCalledWith("/"));
    expect(view.container.textContent).toBe("");
  });
});
