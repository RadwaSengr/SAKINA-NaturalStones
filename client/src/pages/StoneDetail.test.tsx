import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import StoneDetail from "./StoneDetail";

vi.mock("wouter", () => ({
  Link: ({ children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => <a {...props}>{children}</a>,
  useLocation: () => ["/stone/earth-essence-stone", vi.fn()],
  useRoute: () => [true, { handle: "earth-essence-stone" }],
}));

vi.mock("@/contexts/CartContext", () => ({ useCart: () => ({ addItem: vi.fn(), loading: false }) }));
vi.mock("@/contexts/LanguageContext", () => ({ useLanguage: () => ({ language: "ar", isArabic: true }) }));
vi.mock("@/lib/trpc", () => ({
  trpc: { commerce: { products: { list: { useQuery: () => ({ data: [], isLoading: true }) } } } },
}));

describe("Stone detail loading", () => {
  it("shows the matching optimized stone image while product data is still loading", () => {
    const html = renderToStaticMarkup(<StoneDetail />);
    expect(html).toContain("Earth-Essence-Stone.PNG");
    expect(html).toContain('fetchPriority="high"');
    expect(html).toContain("نفتح بطاقة الحجر");
  });
});
