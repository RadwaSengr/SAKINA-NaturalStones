// @vitest-environment jsdom
import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import OwnerOrders, { buildOrderExportRows, filterOrdersByDateRange } from "./OwnerOrders";

const lifecycle = vi.hoisted(() => ({
  onError: undefined as undefined | (() => void),
  onSuccess: undefined as undefined | (() => void),
  mutate: vi.fn(),
}));

vi.mock("@/components/DashboardLayout", () => ({ default: ({ children }: { children: React.ReactNode }) => <section>{children}</section> }));
vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: { role: "admin", isOwner: true }, loading: false }) }));
vi.mock("@/contexts/LanguageContext", () => ({ useLanguage: () => ({ language: "ar", isArabic: true }) }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ commerce: { orders: { ownerList: { invalidate: vi.fn() } } } }),
    commerce: {
      orders: {
        ownerList: { useQuery: () => ({ data: [{ id: 1, reference: "SKN-STATUS-1", status: "pending_cod", paymentMethod: "cash_on_delivery", customerName: "Radwa", email: "radwa@example.com", phone: "01000000000", addressLine1: "Street", addressLine2: null, city: "Damanhour", governorate: "Beheira", postalCode: null, preparation: "single", customerNote: null, itemsJson: "[]", subtotalPiasters: 95_000, shippingPiasters: 11_800, totalPiasters: 106_800, createdAt: new Date(), updatedAt: new Date() }], isLoading: false, isError: false }) },
        updateStatus: { useMutation: (options: { onError?: () => void; onSuccess?: () => void }) => { lifecycle.onError = options.onError; lifecycle.onSuccess = options.onSuccess; return { mutate: lifecycle.mutate, isPending: false }; } },
      },
    },
  },
}));

describe("Owner order status feedback", () => {
  beforeEach(() => {
    lifecycle.onError = undefined;
    lifecycle.onSuccess = undefined;
    lifecycle.mutate.mockReset();
  });

  it("shows the real component error after a failed mutation and clears it on retry/success", async () => {
    render(<OwnerOrders />);
    await act(async () => lifecycle.onError?.());
    expect(screen.getByRole("alert").textContent).toContain("لم يتم حفظ التغيير");

    fireEvent.change(screen.getAllByRole("combobox")[0], { target: { value: "preparing" } });
    expect(screen.queryByRole("alert")).toBeNull();
    expect(lifecycle.mutate).toHaveBeenCalledWith({ reference: "SKN-STATUS-1", status: "preparing" });

    await act(async () => lifecycle.onSuccess?.());
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("builds an Arabic Excel row for the visible owner order without card data", () => {
    const order = { id: 1, reference: "SKN-EXCEL-1", status: "preparing" as const, paymentMethod: "cash_on_delivery" as const, customerName: "Radwa", email: "radwa@example.com", phone: "01000000000", addressLine1: "Street", addressLine2: null, city: "Damanhour", governorate: "Beheira", postalCode: null, preparation: "tasbih" as const, customerNote: null, itemsJson: JSON.stringify([{ title: "حجر جمشت هادئ", quantity: 2 }]), subtotalPiasters: 112_000, shippingPiasters: 11_800, tasbihAssemblyPiasters: 55_000, totalPiasters: 178_800, createdAt: new Date("2026-08-27T12:00:00Z"), updatedAt: new Date() };
    const [row] = buildOrderExportRows([order], "ar");
    expect(row).toMatchObject({ "رقم الطلب": "SKN-EXCEL-1", "حالة الطلب": "قيد التجهيز", "التجهيز": "سبحة", "إجمالي الطلب (ج.م.)": 1788 });
    expect(row).not.toHaveProperty("رقم البطاقة");
  });

  it("filters orders inclusively by the selected local calendar dates before export", () => {
    const orders = [
      { reference: "SKN-DATE-1", createdAt: new Date(2026, 7, 10, 0, 0, 0) },
      { reference: "SKN-DATE-2", createdAt: new Date(2026, 7, 11, 23, 59, 59) },
      { reference: "SKN-DATE-3", createdAt: new Date(2026, 7, 12, 0, 0, 0) },
    ];
    expect(filterOrdersByDateRange(orders, "2026-08-10", "2026-08-11").map(order => order.reference)).toEqual(["SKN-DATE-1", "SKN-DATE-2"]);
    expect(filterOrdersByDateRange(orders, "2026-08-12", "2026-08-10")).toEqual([]);
  });
});
