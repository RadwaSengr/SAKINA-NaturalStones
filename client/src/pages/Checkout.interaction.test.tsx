// @vitest-environment jsdom
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Checkout from "./Checkout";

const updateQuantity = vi.fn();

vi.mock("wouter", () => ({
  Link: ({ children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => <a {...props}>{children}</a>,
  useLocation: () => ["/checkout", vi.fn()],
}));

vi.mock("@/contexts/CartContext", () => ({
  useCart: () => ({
    cart: {
      id: "sakina-local-cart",
      itemCount: 2,
      subtotal: { amount: "600", currencyCode: "EGP" },
      total: { amount: "600", currencyCode: "EGP" },
      items: [{
        lineId: "sakina:clear-quartz-stone:default",
        variantId: "sakina:clear-quartz-stone:default",
        productHandle: "clear-quartz-stone",
        productTitle: "حجر كوارتز صافي",
        variantTitle: "Default Title",
        quantity: 2,
        unitPrice: { amount: "300", currencyCode: "EGP" },
        lineTotal: { amount: "600", currencyCode: "EGP" },
        image: null,
      }],
    },
    itemCount: 2,
    loading: false,
    updateQuantity,
    clearCart: vi.fn(),
  }),
}));

vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({ language: "ar", isArabic: true }),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    commerce: {
      orders: {
        createCashOnDelivery: { useMutation: () => ({ mutateAsync: vi.fn(), isPending: false, isError: false }) },
      },
    },
  },
}));

describe("Checkout interactions", () => {
  it("shows the quantity-based tasbih fee and keeps quantity controls out of form submission", () => {
    render(<Checkout />);

    expect(screen.getByRole("button", { name: "زيادة الكمية" }).getAttribute("type")).toBe("button");
    fireEvent.click(screen.getAllByRole("radio")[1]);

    expect(screen.getAllByText("تجهيز السبحة والخرز")).toHaveLength(2);
    expect(document.querySelector(".tasbih-price-note strong")?.textContent).toContain("٥٥٠");
    expect(document.querySelector(".checkout-totals__total strong")?.textContent).toContain("١٬٢٦٨");
  });
});
