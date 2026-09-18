// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MobileTabBar, StoreHeader } from "./StoreChrome";

const authState = vi.hoisted(() => ({ user: { role: "admin", isOwner: true } as { role: "admin" | "user"; isOwner: boolean } | null }));
const setLocation = vi.hoisted(() => vi.fn());
const startLogin = vi.hoisted(() => vi.fn());

vi.mock("wouter", () => ({
  Link: ({ children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => <a {...props}>{children}</a>,
  useLocation: () => ["/", setLocation],
}));
vi.mock("@/const", () => ({ startLogin }));
vi.mock("@/contexts/CartContext", () => ({ useCart: () => ({ itemCount: 0, isOpen: false, openCart: vi.fn() }) }));
vi.mock("@/contexts/LanguageContext", () => ({ useLanguage: () => ({ language: "ar", isArabic: true, toggleLanguage: vi.fn() }) }));
vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: authState.user }) }));

describe("Owner storefront entry", () => {
  afterEach(cleanup);

  beforeEach(() => {
    window.history.replaceState({}, "", "/?mobile=1");
    localStorage.clear();
    setLocation.mockReset();
    startLogin.mockReset();
    authState.user = { role: "admin", isOwner: true };
  });

  it("shows the compact management entry to an owner and hides it after the session becomes non-owner", () => {
    const view = render(<StoreHeader />);
    expect(screen.getByRole("link", { name: "طلبات المالك" }).getAttribute("href")).toBe("/owner");
    expect(document.querySelector("header")?.className).toContain("store-header--mobile-preview");

    authState.user = { role: "admin", isOwner: false };
    view.rerender(<StoreHeader />);
    expect(screen.queryByRole("link", { name: "طلبات المالك" })).toBeNull();
  });

  it.each([
    { width: 375, path: "/?mobile=1" },
    { width: 1280, path: "/" },
  ])("keeps the owner link out of an isolated customer header at $width px", ({ width, path }) => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: width });
    window.history.replaceState({}, "", path);
    authState.user = null;
    const view = render(<StoreHeader />);
    expect(screen.queryByRole("link", { name: "طلبات المالك" })).toBeNull();
    view.unmount();
  });

  it("keeps management out of the default mobile taskbar and reveals it after an upward swipe by the owner", () => {
    render(<MobileTabBar />);
    expect(screen.queryByRole("button", { name: "إدارة" })).toBeNull();
    const navigation = screen.getByRole("navigation", { name: "تنقل التطبيق" });
    fireEvent.touchStart(navigation, { touches: [{ clientY: 120 }] });
    fireEvent.touchEnd(navigation, { changedTouches: [{ clientY: 60 }] });
    fireEvent.click(screen.getByRole("button", { name: "إدارة" }));
    expect(setLocation).toHaveBeenCalledWith("/owner");
  });

  it("offers a hidden swipe-to-sign-in panel from any phone without exposing owner orders", () => {
    authState.user = null;
    render(<MobileTabBar />);
    const navigation = screen.getByRole("navigation", { name: "تنقل التطبيق" });
    fireEvent.touchStart(navigation, { touches: [{ clientY: 120 }] });
    fireEvent.touchEnd(navigation, { changedTouches: [{ clientY: 60 }] });
    fireEvent.click(screen.getByRole("button", { name: "دخول المالكة" }));
    expect(startLogin).toHaveBeenCalledWith("/owner");
  });
});
