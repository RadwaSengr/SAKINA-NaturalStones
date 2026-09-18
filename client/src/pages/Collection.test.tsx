import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import Collection from "./Collection";

vi.mock("wouter", () => ({
  Link: ({ children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => <a {...props}>{children}</a>,
}));

vi.mock("@/contexts/CartContext", () => ({
  useCart: () => ({ addItem: vi.fn(), loading: false }),
}));

vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({ language: "ar", isArabic: true }),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    commerce: {
      products: {
        list: {
          useQuery: () => ({
            isLoading: false,
            data: [{
              id: "sakina:amethyst-stone",
              handle: "amethyst-stone",
              title: "حجر جمشت هادئ",
              description: "حجر فردي مختار بعناية.",
              descriptionHtml: "<p>حجر فردي مختار بعناية.</p>",
              productType: "Natural Stone",
              vendor: "SAKINA",
              tags: ["جمشت"],
              images: [],
              options: [],
              priceRange: { min: { amount: "560", currencyCode: "EGP" }, max: { amount: "560", currencyCode: "EGP" } },
              variants: [{ id: "sakina:amethyst-stone:default", title: "Default Title", availableForSale: true, price: { amount: "560", currencyCode: "EGP" }, compareAtPrice: null, selectedOptions: [] }],
            }, {
              id: "sakina:clear-quartz-stone",
              handle: "clear-quartz-stone",
              title: "حجر كوارتز صافي",
              description: "حجر فردي مختار بعناية.",
              descriptionHtml: "<p>حجر فردي مختار بعناية.</p>",
              productType: "Natural Stone",
              vendor: "SAKINA",
              tags: ["كوارتز"],
              images: [],
              options: [],
              priceRange: { min: { amount: "300", currencyCode: "EGP" }, max: { amount: "300", currencyCode: "EGP" } },
              variants: [{ id: "sakina:clear-quartz-stone:default", title: "Default Title", availableForSale: true, price: { amount: "300", currencyCode: "EGP" }, compareAtPrice: null, selectedOptions: [] }],
            }],
          }),
        },
      },
    },
  },
}));

describe("Dedicated collection page", () => {
  it("renders the cabinet and its live product cards on the standalone route", () => {
    const html = renderToStaticMarkup(<Collection />);
    expect(html).toContain("خزانة سكينة");
    expect(html).toContain("حجر جمشت هادئ");
    expect(html).toContain("أضيفي للحقيبة");
    expect(html).toContain("بطاقة تعريف الحجر");
    expect(html).toContain('loading="eager"');
    expect(html).toContain('fetchPriority="high"');
    expect(html).toContain('loading="lazy"');
    expect(html).toContain('decoding="async"');
    expect(html).toContain("Quiet-Amethyst.PNG");
  });
});
