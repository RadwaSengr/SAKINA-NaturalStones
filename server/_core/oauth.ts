import { COOKIE_NAME, ONE_YEAR_MS, OAUTH_STATE_COOKIE, decodeOAuthState } from "@shared/const";
import { parse as parseCookieHeader } from "cookie";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { ENV } from "./env";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

function safeInlineJson(value: string) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export function getSafeReturnTo(state: string) {
  const { returnTo } = decodeOAuthState(state);
  return typeof returnTo === "string" && returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/";
}

export function hasValidOAuthState(state: string, cookieNonce?: string, storageNonce?: string) {
  const { nonce } = decodeOAuthState(state);
  return Boolean(nonce && (nonce === cookieNonce || nonce === storageNonce));
}

async function completeOAuthLogin(req: Request, res: Response, code: string, state: string) {
  const tokenResponse = await sdk.exchangeCodeForToken(code, state);
  const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
  if (!userInfo.openId) throw new Error("openId missing from user info");

  await db.upsertUser({
    openId: userInfo.openId,
    name: userInfo.name || null,
    email: userInfo.email ?? null,
    loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
    lastSignedIn: new Date(),
  });

  const sessionToken = await sdk.createSessionToken(userInfo.openId, {
    name: userInfo.name || "",
    expiresInMs: ONE_YEAR_MS,
  });
  const cookieOptions = getSessionCookieOptions(req);
  res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
  return sessionToken;
}

function renderStorageRecovery(res: Response, code: string, state: string) {
  const escapedCode = safeInlineJson(code);
  const escapedState = safeInlineJson(state);
  const escapedCookieName = safeInlineJson(COOKIE_NAME);
  res.status(200).type("html").send(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Completing sign in</title></head><body><script>
    const login = { code: ${escapedCode}, state: ${escapedState} };
    const storageNonce = sessionStorage.getItem("sakina-oauth-state-nonce");
    const storedReturnTo = sessionStorage.getItem("sakina-oauth-return-to") || "/";
    const returnTo = storedReturnTo.startsWith("/") && !storedReturnTo.startsWith("//") ? storedReturnTo : "/";
    if (!storageNonce) { document.body.textContent = "Unable to verify sign in. Please return and try again."; }
    else fetch("/api/oauth/complete", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...login, storageNonce }) })
      .then(response => response.ok ? response.json() : Promise.reject())
      .then(result => { sessionStorage.setItem("sakina-session-cookie", ${escapedCookieName} + "=" + result.sessionToken); sessionStorage.removeItem("sakina-oauth-state-nonce"); sessionStorage.removeItem("sakina-oauth-return-to"); window.location.replace(returnTo); })
      .catch(() => { document.body.textContent = "Unable to complete sign in. Please return and try again."; });
  </script></body></html>`);
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    const cookieNonce = parseCookieHeader(req.headers.cookie ?? "")[OAUTH_STATE_COOKIE];
    if (!hasValidOAuthState(state, cookieNonce)) {
      // Embedded preview browsers can block this cross-site nonce cookie. The
      // recovery page asks the same browser for its sessionStorage nonce and
      // POSTs it back; state still has to match exactly before any code exchange.
      renderStorageRecovery(res, code, state);
      return;
    }
    res.clearCookie(OAUTH_STATE_COOKIE, { path: "/", secure: true, sameSite: "none" });
    try {
      await completeOAuthLogin(req, res, code, state);
      res.redirect(302, getSafeReturnTo(state));
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });

  app.post("/api/oauth/complete", async (req: Request, res: Response) => {
    const code = typeof req.body?.code === "string" ? req.body.code : undefined;
    const state = typeof req.body?.state === "string" ? req.body.state : undefined;
    const storageNonce = typeof req.body?.storageNonce === "string" ? req.body.storageNonce : undefined;
    if (!code || !state || !hasValidOAuthState(state, undefined, storageNonce)) {
      res.status(403).json({ error: "invalid oauth state" });
      return;
    }
    try {
      const sessionToken = await completeOAuthLogin(req, res, code, state);
      res.json({ sessionToken });
    } catch (error) {
      console.error("[OAuth] Browser storage recovery failed", error);
      res.status(500).json({ error: "OAuth login failed" });
    }
  });

  app.get("/api/auth/dev-login", async (req: Request, res: Response) => {
    const returnTo = getQueryParam(req, "returnTo") || "/owner";
    const safeReturnTo = returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/owner";
    const ownerId = ENV.ownerOpenId || "sakina_owner_local";

    await db.upsertUser({
      openId: ownerId,
      name: "SAKINA owner",
      email: "owner@sakina.example",
      loginMethod: "local",
      role: "admin",
      lastSignedIn: new Date(),
    });

    const sessionToken = await sdk.createSessionToken(ownerId, {
      name: "SAKINA owner",
      expiresInMs: ONE_YEAR_MS,
    });
    const cookieOptions = getSessionCookieOptions(req);
    res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
    return res.redirect(safeReturnTo);
  });
}
