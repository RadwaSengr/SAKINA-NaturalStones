import {
  OAUTH_RETURN_TO_STORAGE_KEY,
  OAUTH_STATE_COOKIE,
  OAUTH_STATE_STORAGE_KEY,
  encodeOAuthState,
} from "@shared/const";

export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Start the application OAuth login. Call this from an event handler or effect at the
// moment you want to navigate, e.g. `onClick={() => startLogin()}`.
//
// It has SIDE EFFECTS — it mints a one-time nonce, writes the __Host- state
// cookie, and navigates immediately — so the cookie nonce always matches the
// `state` it sends. Do NOT call it during render (no `href={startLogin()}` /
// `loginUrl={...}`): each call overwrites the cookie, so a stray render-phase
// call would desync it from an in-flight login and the callback would reject it
// with "invalid oauth state". It returns void by design, so there is no URL to
// stash across renders.
export const startLogin = (returnToPath?: string) => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const requestedReturnTo =
    returnToPath ?? `${window.location.pathname}${window.location.search}`;
  const returnTo =
    requestedReturnTo.startsWith("/") && !requestedReturnTo.startsWith("//")
      ? requestedReturnTo
      : "/";

  if (!oauthPortalUrl) {
    window.location.href = `/api/auth/dev-login?returnTo=${encodeURIComponent(returnTo)}`;
    return;
  }

  const nonce = crypto.randomUUID();
  document.cookie = `${OAUTH_STATE_COOKIE}=${nonce}; Path=/; Max-Age=600; SameSite=None; Secure`;
  try {
    sessionStorage.setItem(OAUTH_STATE_STORAGE_KEY, nonce);
    sessionStorage.setItem(OAUTH_RETURN_TO_STORAGE_KEY, returnTo);
  } catch {
    // The regular host-only cookie route remains available where storage is unavailable.
  }
  const state = encodeOAuthState({ redirectUri, nonce, returnTo });

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  window.location.href = url.toString();
};
