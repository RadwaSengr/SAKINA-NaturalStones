import { describe, expect, it } from "vitest";
import { encodeOAuthState } from "@shared/const";
import { getSafeReturnTo, hasValidOAuthState } from "./_core/oauth";

describe("OAuth state validation", () => {
  const state = encodeOAuthState({ redirectUri: "https://sakina.example/api/oauth/callback", nonce: "nonce-123" });

  it("accepts only a matching nonce from either the host cookie or same-browser session storage", () => {
    expect(hasValidOAuthState(state, "nonce-123")).toBe(true);
    expect(hasValidOAuthState(state, undefined, "nonce-123")).toBe(true);
    expect(hasValidOAuthState(state, "wrong", "also-wrong")).toBe(false);
  });

  it("rejects a malformed or legacy state with no nonce", () => {
    expect(hasValidOAuthState("not-base64", "nonce-123")).toBe(false);
    expect(hasValidOAuthState(btoa("https://sakina.example/api/oauth/callback"), "nonce-123")).toBe(false);
  });

  it("returns the signed in owner to an internal requested route only", () => {
    expect(getSafeReturnTo(encodeOAuthState({ redirectUri: "https://sakina.example/api/oauth/callback", nonce: "nonce-123", returnTo: "/owner" }))).toBe("/owner");
    expect(getSafeReturnTo(encodeOAuthState({ redirectUri: "https://sakina.example/api/oauth/callback", nonce: "nonce-123", returnTo: "//unsafe.example" }))).toBe("/");
  });
});
