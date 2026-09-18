import type { Request } from "express";

export function getSessionCookieOptions(req: Request) {
  const isSecure =
    req.secure ||
    req.protocol === "https" ||
    process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isSecure,
    sameSite: isSecure ? ("none" as const) : ("lax" as const),
    path: "/",
  };
}
