import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";
import { appRouter } from "./routers";

function makeCtx(): TrpcContext {
  return { user: null, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"] };
}

describe("website-owned commerce catalog", () => {
  it("returns the six in-site stones with the agreed 300–800 EGP price ladder", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const products = await appRouter.createCaller(makeCtx()).commerce.products.list({ first: 50 });
    expect(products).toHaveLength(6);
    expect(products.map(product => product.priceRange.min.amount)).toEqual(["300", "380", "460", "560", "680", "800"]);
    expect(products.every(product => product.priceRange.min.currencyCode === "EGP")).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("returns a local stone by handle and rejects an unknown one", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(caller.commerce.products.byHandle({ handle: "amethyst-stone" })).resolves.toMatchObject({ title: "حجر جمشت هادئ", priceRange: { min: { amount: "560" } } });
    await expect(caller.commerce.products.byHandle({ handle: "not-a-stone" })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
