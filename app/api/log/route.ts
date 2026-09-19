import { NextRequest, NextResponse } from "next/server";
import { logHit, type Hit } from "@/lib/store";

/**
 * Deliberately NOT edge runtime.
 *
 * Next.js edge functions each run in their own isolated sandbox (even
 * self-hosted, via the `edge-runtime` package) — so a module-level
 * in-memory array in `lib/store.ts` written from `middleware.ts` (which
 * MUST run on the edge — Next.js doesn't allow Node-runtime middleware)
 * is invisible to `/api/stats`, even if that route also imports the same
 * file, because it's a different JS isolate entirely.
 *
 * Node.js-runtime route handlers, by contrast, share one long-lived
 * module cache within a single server process (true for `next start` /
 * `next dev`, and for a warm Vercel Node.js function). So: middleware
 * relays hits here over an internal HTTP call, and this route — plus
 * `/api/stats`, also Node runtime — actually share the same in-memory
 * array.
 *
 * If UPSTASH_REDIS_REST_URL/TOKEN are set, none of this matters — both
 * middleware and this route write straight to Redis instead, which is
 * the right answer for real multi-instance production deployments.
 */

export async function POST(req: NextRequest) {
  try {
    const hit = (await req.json()) as Hit;
    logHit(hit);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
