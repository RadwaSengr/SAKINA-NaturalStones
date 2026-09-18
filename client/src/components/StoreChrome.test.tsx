import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MobileTabBar, StoreHeader } from "./StoreChrome";

const authState = vi.hoisted(() => ({ user: { role: "admin", isOwner: true } as { role: "admin" | "user"; isOwner: boolean } | null }));

vi.mock("wouter", () => ({
  Link: ({ children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => <a {...props}>{children}</a>,
  useLocation: () => ["/collection", vi.fn()],
}));

vi.mock("@/contexts/CartContext", () => ({
  useCart: () => ({ itemCount: 2, isOpen: false, openCart: vi.fn() }),
}));

vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({ language: "ar", isArabic: true, toggleLanguage: vi.fn() }),
}));

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: authState.user }) }));
vi.mock("@/const", () => ({ startLogin: vi.fn() }));

describe("Store navigation", () => {
  it("keeps the essential destinations concise and highlights the active mobile destination", () => {
    const html = renderToStaticMarkup(<><StoreHeader /><MobileTabBar /></>);
    expect(html).toContain("الرئيسية");
    expect(html).toContain("الخزانة");
    expect(html).toContain("الشهادة");
    expect(html).toContain("تسوّقي");
    expect(html).toContain("الطلبات");
    expect(html).not.toContain("mobile-tabbar--owner");
    expect(html).toMatch(/class="is-active"/);
  });

  it("keeps the owner entry absent for customers", () => {
    authState.user = { role: "admin", isOwner: false };
    const html = renderToStaticMarkup(<StoreHeader />);
    expect(html).not.toContain("الطلبات");
    authState.user = { role: "admin", isOwner: true };
  });
});
