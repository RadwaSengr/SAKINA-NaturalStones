import type { Request, Response } from "express";
import { COOKIE_NAME } from "@shared/const";
import { getUserByOpenId } from "../db";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: Request;
  res: Response;
  user: Awaited<ReturnType<typeof getUserByOpenId>> | null;
};

export async function createContext(opts: {
  req: Request;
  res: Response;
}): Promise<TrpcContext> {
  const token = opts.req.cookies?.[COOKIE_NAME] as string | undefined;
  let user: TrpcContext["user"] = null;

  if (token) {
    try {
      const openId = await sdk.verifySessionToken(token);
      user = openId ? ((await getUserByOpenId(openId)) ?? null) : null;
    } catch {
      user = null;
    }
  }

  return { req: opts.req, res: opts.res, user };
}
