import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const { isSakinaOwnerMock } = vi.hoisted(() => ({ isSakinaOwnerMock: vi.fn() }));
vi.mock("./db", () => ({ isSakinaOwner: isSakinaOwnerMock }));
import { appRouter } from "./routers";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function makeCtx(user: AuthenticatedUser): TrpcContext {
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

const soleOwner: AuthenticatedUser = {
  id: 1,
  openId: "registered-sakina-owner",
  name: "SAKINA owner",
  email: "owner@sakina.example",
  loginMethod: "manus",
  role: "admin",
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

beforeEach(() => {
  isSakinaOwnerMock.mockReset();
  isSakinaOwnerMock.mockImplementation(async openId => openId === soleOwner.openId);
});

describe("auth.me owner recognition", () => {
  it("marks only the sole server-registered admin as the owner", async () => {
    await expect(appRouter.createCaller(makeCtx(soleOwner)).auth.me()).resolves.toMatchObject({ isOwner: true });

    await expect(
      appRouter.createCaller(makeCtx({ ...soleOwner, id: 2, openId: "another-admin" })).auth.me(),
    ).resolves.toMatchObject({ isOwner: false });
  });

  it("does not look up ownership for customer accounts", async () => {
    await expect(
      appRouter.createCaller(makeCtx({ ...soleOwner, id: 3, openId: "customer", role: "user" })).auth.me(),
    ).resolves.toMatchObject({ isOwner: false });
    expect(isSakinaOwnerMock).not.toHaveBeenCalled();
  });
});
