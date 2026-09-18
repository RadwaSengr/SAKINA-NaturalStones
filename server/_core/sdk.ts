import { createHmac, timingSafeEqual } from "node:crypto";
import { ENV } from "./env";

type TokenResponse = { accessToken: string };
type UserInfo = {
  openId?: string;
  name?: string;
  email?: string;
  loginMethod?: string;
  platform?: string;
};

function secret() {
  return ENV.cookieSecret || "sakina-development-secret-change-me";
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

function encode(payload: Record<string, unknown>) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

function decode(token: string): Record<string, unknown> | null {
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  const expected = sign(body);
  if (
    expected.length !== signature.length ||
    !timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  )
    return null;
  try {
    return JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

async function postJson(url: string, body: unknown): Promise<any> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok)
    throw new Error(`OAuth request failed (${response.status})`);
  return response.json();
}

export const sdk = {
  async exchangeCodeForToken(
    code: string,
    state: string
  ): Promise<TokenResponse> {
    if (!ENV.oAuthServerUrl)
      throw new Error("OAUTH_SERVER_URL is not configured");
    return postJson(`${ENV.oAuthServerUrl.replace(/\/$/, "")}/oauth/token`, {
      code,
      state,
      appId: ENV.appId,
    });
  },
  async getUserInfo(accessToken: string): Promise<UserInfo> {
    if (!ENV.oAuthServerUrl)
      throw new Error("OAUTH_SERVER_URL is not configured");
    const response = await fetch(
      `${ENV.oAuthServerUrl.replace(/\/$/, "")}/oauth/userinfo`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!response.ok)
      throw new Error(`OAuth userinfo failed (${response.status})`);
    return response.json();
  },
  async createSessionToken(
    openId: string,
    options: { name?: string; expiresInMs: number }
  ) {
    return encode({
      openId,
      name: options.name ?? "",
      exp: Date.now() + options.expiresInMs,
    });
  },
  async verifySessionToken(token: string): Promise<string | null> {
    const payload = decode(token);
    if (
      !payload ||
      typeof payload.openId !== "string" ||
      typeof payload.exp !== "number" ||
      payload.exp < Date.now()
    )
      return null;
    return payload.openId;
  },
};
