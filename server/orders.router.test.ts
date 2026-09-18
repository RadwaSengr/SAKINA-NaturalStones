import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";
import { ENV } from "./_core/env";
import { calculateTasbihAssemblyPiasters } from "./routers/commerce";

const { createSakinaOrderMock, isSakinaOwnerMock, listSakinaOrdersMock, notifyOwnerMock, updateSakinaOrderStatusMock } = vi.hoisted(() => ({ createSakinaOrderMock: vi.fn(), isSakinaOwnerMock: vi.fn(), listSakinaOrdersMock: vi.fn(), notifyOwnerMock: vi.fn(), updateSakinaOrderStatusMock: vi.fn() }));
vi.mock("./db", () => ({ createSakinaOrder: createSakinaOrderMock, isSakinaOwner: isSakinaOwnerMock, listSakinaOrders: listSakinaOrdersMock, updateSakinaOrderStatus: updateSakinaOrderStatusMock }));
vi.mock("./_core/notification", () => ({ notifyOwner: notifyOwnerMock }));
import { appRouter } from "./routers";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;
function makeCtx(user: AuthenticatedUser | null = null): TrpcContext {
  return { user, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"] };
}
const adminUser: AuthenticatedUser = { id: 1, openId: ENV.ownerOpenId, name: "SAKINA owner", email: "owner@sakina.example", loginMethod: "manus", role: "admin", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };
const customerUser: AuthenticatedUser = { ...adminUser, id: 2, openId: "customer", role: "user" };
const otherAdminUser: AuthenticatedUser = { ...adminUser, id: 3, openId: "other-admin", role: "admin" };

const delivery = { customerName: "Radwa Senger", email: "radwa@example.com", phone: "01000000000", addressLine1: "Elbatat street", city: "Damanhour", governorate: "Beheira" };
beforeEach(() => { createSakinaOrderMock.mockReset(); isSakinaOwnerMock.mockReset(); isSakinaOwnerMock.mockImplementation(async openId => openId === adminUser.openId); listSakinaOrdersMock.mockReset(); notifyOwnerMock.mockReset(); notifyOwnerMock.mockResolvedValue(true); updateSakinaOrderStatusMock.mockReset(); });

describe("commerce.orders.createCashOnDelivery", () => {
  it("uses only local catalog prices for a single-stone order and stores no card data", async () => {
    createSakinaOrderMock.mockResolvedValue(undefined);
    const result = await appRouter.createCaller(makeCtx()).commerce.orders.createCashOnDelivery({ ...delivery, items: [{ handle: "amethyst-stone", quantity: 1 }], preparation: "single" });
    expect(result).toMatchObject({ paymentMethod: "cash_on_delivery", subtotalPiasters: 56_000, shippingPiasters: 11_800, tasbihAssemblyPiasters: 0, totalPiasters: 67_800 });
    const stored = createSakinaOrderMock.mock.calls[0][0];
    expect(stored).toMatchObject({ subtotalPiasters: 56_000, tasbihAssemblyPiasters: 0, totalPiasters: 67_800 });
    expect(stored).not.toHaveProperty("cardNumber");
    expect(stored).not.toHaveProperty("cardCvv");
    expect(notifyOwnerMock).toHaveBeenCalledWith(expect.objectContaining({ title: "طلب جديد في SAKINA", content: expect.stringContaining(result.reference) }));
  });

  it("adds the quantity-based tasbih assembly cost from the internal rule", async () => {
    createSakinaOrderMock.mockResolvedValue(undefined);
    const result = await appRouter.createCaller(makeCtx()).commerce.orders.createCashOnDelivery({ ...delivery, items: [{ handle: "earth-essence-stone", quantity: 2 }], preparation: "tasbih" });
    expect(result).toMatchObject({ subtotalPiasters: 136_000, shippingPiasters: 11_800, tasbihAssemblyPiasters: 55_000, totalPiasters: 202_800 });
    expect(calculateTasbihAssemblyPiasters(1)).toBe(50_000);
    expect(calculateTasbihAssemblyPiasters(10)).toBe(95_000);
    expect(calculateTasbihAssemblyPiasters(20)).toBe(100_000);
  });

  it("rejects an unknown stone handle before an order can be stored", async () => {
    await expect(
      appRouter.createCaller(makeCtx()).commerce.orders.createCashOnDelivery({
        ...delivery,
        items: [{ handle: "unknown-stone", quantity: 1 }],
        preparation: "single",
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(createSakinaOrderMock).not.toHaveBeenCalled();
  });

  it("keeps a saved order successful if the owner notification service is unavailable", async () => {
    createSakinaOrderMock.mockResolvedValue(undefined);
    notifyOwnerMock.mockRejectedValue(new Error("notification unavailable"));
    await expect(appRouter.createCaller(makeCtx()).commerce.orders.createCashOnDelivery({ ...delivery, items: [{ handle: "clear-quartz-stone", quantity: 1 }], preparation: "single" })).resolves.toMatchObject({ ownerNotificationSent: false });
  });
});

describe("commerce.orders owner management", () => {
  it("rejects order listing for non-owners", async () => {
    await expect(appRouter.createCaller(makeCtx(customerUser)).commerce.orders.ownerList()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects an admin account that is not the sole server-registered owner", async () => {
    await expect(appRouter.createCaller(makeCtx(otherAdminUser)).commerce.orders.ownerList()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("lets the owner list orders and change their fulfillment status", async () => {
    const order = { id: 1, reference: "SKN-OWNER-1", status: "pending_cod", paymentMethod: "cash_on_delivery", customerName: "Radwa Senger", email: "radwa@example.com", phone: "01000000000", addressLine1: "Elbatat street", addressLine2: null, city: "Damanhour", governorate: "Beheira", postalCode: null, preparation: "tasbih", customerNote: null, itemsJson: "[]", subtotalPiasters: 56_000, shippingPiasters: 11_800, tasbihAssemblyPiasters: 50_000, totalPiasters: 117_800, createdAt: new Date(), updatedAt: new Date() };
    listSakinaOrdersMock.mockResolvedValue([order]); updateSakinaOrderStatusMock.mockResolvedValue({ ...order, status: "in_transit" });
    const caller = appRouter.createCaller(makeCtx(adminUser));
    await expect(caller.commerce.orders.ownerList()).resolves.toEqual([order]);
    await expect(caller.commerce.orders.updateStatus({ reference: "SKN-OWNER-1", status: "in_transit" })).resolves.toMatchObject({ reference: "SKN-OWNER-1", status: "in_transit" });
  });
});
