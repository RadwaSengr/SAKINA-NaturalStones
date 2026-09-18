import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import Checkout from "./Checkout";

vi.mock("wouter", () => ({
  Link: ({ children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => <a {...props}>{children}</a>,
  useLocation: () => ["/checkout", vi.fn()],
}));

const updateQuantity = vi.fn();
const clearCart = vi.fn();

vi.mock("@/contexts/CartContext", () => ({
  useCart: () => ({
    cart: {
      id: "sakina-local-cart",
      itemCount: 2,
      subtotal: { amount: "1120", currencyCode: "EGP" },
      total: { amount: "1120", currencyCode: "EGP" },
      items: [{
        lineId: "sakina:amethyst-stone:default",
        variantId: "sakina:amethyst-stone:default",
        productHandle: "amethyst-stone",
        productTitle: "حجر جمشت هادئ",
        variantTitle: "Default Title",
        quantity: 2,
        unitPrice: { amount: "560", currencyCode: "EGP" },
        lineTotal: { amount: "1120", currencyCode: "EGP" },
        image: null,
      }],
    },
    itemCount: 2,
    loading: false,
    updateQuantity,
    clearCart,
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

describe("In-site checkout", () => {
  it("shows delivery fields, COD, and a card preview without card-data inputs for a populated Arabic cart", () => {
    const html = renderToStaticMarkup(<Checkout />);

    expect(html).toContain("الكمية");
    expect(html).toContain("قطعة فردية");
    expect(html).toContain("تجهيز كسبحة");
    expect(html).toContain("NOTE — ملاحظة للطلب");
    expect(html).toContain("حجر جمشت هادئ");
    expect(html).toContain("إجمالي المنتجات");
    expect(html).toContain("بيانات التوصيل");
    expect(html).toContain("الدفع عند الاستلام");
    expect(html).toContain("Visa / MasterCard");
    expect(html).toContain("لا توجد حقول بطاقة هنا");
    expect(html).toContain("تجهيز كسبحة");
    expect(html).toContain("لن تنتقلي إلى أي موقع خارجي");
  });
});
