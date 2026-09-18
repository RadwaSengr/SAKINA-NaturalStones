import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import OwnerOrders, { ownerStatusFeedbackReducer, OwnerStatusUpdateError } from "./OwnerOrders";

vi.mock("wouter", () => ({ Link: ({ children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => <a {...props}>{children}</a>, useLocation: () => ["/owner", vi.fn()] }));
vi.mock("@/components/DashboardLayout", () => ({ default: ({ children }: { children: React.ReactNode }) => <section>{children}</section> }));
vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({ user: { role: "admin", isOwner: true }, loading: false }),
}));
vi.mock("@/contexts/LanguageContext", () => ({ useLanguage: () => ({ language: "ar", isArabic: true }) }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ commerce: { orders: { ownerList: { invalidate: vi.fn() } } } }),
    commerce: {
      orders: {
        ownerList: { useQuery: () => ({ data: [{ id: 1, reference: "SKN-TEST-1", status: "preparing", paymentMethod: "cash_on_delivery", customerName: "Radwa Senger", email: "radwa@example.com", phone: "01000000000", addressLine1: "Elbatat street", addressLine2: null, city: "Damanhour", governorate: "Beheira", postalCode: null, preparation: "tasbih", customerNote: "اتصال قبل التوصيل", itemsJson: '[{"title":"حجر جمشت هادئ","quantity":1,"lineTotal":{"amount":"560","currencyCode":"EGP"}}]', subtotalPiasters: 56_000, shippingPiasters: 11_800, tasbihAssemblyPiasters: 50_000, totalPiasters: 117_800, createdAt: new Date("2026-08-26T12:00:00Z"), updatedAt: new Date("2026-08-26T12:00:00Z") }], isLoading: false, isError: false }) },
        updateStatus: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      },
    },
  },
}));

describe("Owner orders dashboard", () => {
  it("shows the owner order register, customer delivery details, and all fulfillment stages", () => {
    const html = renderToStaticMarkup(<OwnerOrders />);
    expect(html).toContain("طلبات المتجر");
    expect(html).toContain("العودة للرئيسية");
    expect(html).toContain('href="/"');
    expect(html).toContain('href="/owner"');
    expect(html).toContain("الطلبات");
    expect(html).toContain("طلبات جديدة");
    expect(html).toContain("قيد التجهيز");
    expect(html).toContain("في الطريق");
    expect(html).toContain("تم التسليم");
    expect(html).toContain("SKN-TEST-1");
    expect(html).toContain("Radwa Senger");
    expect(html).toContain("حجر جمشت هادئ");
    expect(html).toContain("تجهيز كسبحة");
    expect(html).toContain("تجهيز السبحة والخرز");
  });

  it("renders a clear inline message when a status update cannot be saved", () => {
    const html = renderToStaticMarkup(<OwnerStatusUpdateError message="لم يتم حفظ التغيير. جرّبي اختيار الحالة مرة أخرى." />);
    expect(html).toContain('role="alert"');
    expect(html).toContain("لم يتم حفظ التغيير");
  });

  it("shows the status error after a failed update and clears it for retry or success", () => {
    expect(ownerStatusFeedbackReducer(false, "failed")).toBe(true);
    expect(ownerStatusFeedbackReducer(true, "retry")).toBe(false);
    expect(ownerStatusFeedbackReducer(true, "succeeded")).toBe(false);
  });
});
