import { describe, expect, it } from "vitest";
import { isAuthTokenExpired } from "./auth";

function createToken(expirationSeconds: number) {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" }))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
  const payload = Buffer.from(JSON.stringify({ exp: expirationSeconds }))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

  return `${header}.${payload}.signature`;
}

describe("isAuthTokenExpired", () => {
  it("returns false for a token that is still valid", () => {
    const token = createToken(Math.floor(Date.now() / 1000) + 60);

    expect(isAuthTokenExpired(token)).toBe(false);
  });

  it("returns true for an expired token", () => {
    const token = createToken(Math.floor(Date.now() / 1000) - 60);

    expect(isAuthTokenExpired(token)).toBe(true);
  });

  it("returns true for malformed tokens", () => {
    expect(isAuthTokenExpired("not-a-real-token")).toBe(true);
  });
});