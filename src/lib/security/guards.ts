import { NextResponse } from "next/server";

type Bucket = { count: number; resetAt: number };

const globalStore = globalThis as typeof globalThis & {
  __rate_limit_store__?: Map<string, Bucket>;
};

const rateStore = globalStore.__rate_limit_store__ ?? new Map<string, Bucket>();
globalStore.__rate_limit_store__ = rateStore;

export function rateLimit(identifier: string, limit = 20, windowMs = 60_000) {
  const now = Date.now();
  const current = rateStore.get(identifier);
  if (!current || current.resetAt < now) {
    rateStore.set(identifier, { count: 1, resetAt: now + windowMs });
    return null;
  }
  if (current.count >= limit) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }
  current.count += 1;
  rateStore.set(identifier, current);
  return null;
}

export function validateCsrf(req: Request) {
  const csrf = req.headers.get("x-csrf-token");
  if (!csrf) return NextResponse.json({ error: "Missing CSRF token" }, { status: 403 });
  return null;
}
