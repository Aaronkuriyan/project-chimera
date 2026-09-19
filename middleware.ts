import { NextRequest, NextResponse, NextFetchEvent } from "next/server";
import { evaluateRequest } from "./lib/bot-detection";
import { logHit, isPersistentStoreConfigured, type Hit } from "./lib/store";

export const config = {
  matcher: ["/", "/pricing", "/article"],
};

export function middleware(req: NextRequest, event: NextFetchEvent) {
  const verdict = evaluateRequest(req.headers);

  const hit: Hit = {
    ts: Date.now(),
    path: req.nextUrl.pathname,
    isBot: verdict.isBot,
    confidence: verdict.confidence,
    matchedIdentity: verdict.matchedIdentity,
    reasons: verdict.reasons,
  };

  // Middleware always runs on the Edge runtime, which sandboxes each
  // invocation into its own isolate — so it can't share the in-memory
  // fallback store's module state with the Node-runtime /api/stats route.
  // If Upstash is configured, we can write straight there (an external
  // service, reachable from any isolate). Otherwise, relay the hit to
  // /api/log — a Node-runtime route that *does* share memory with
  // /api/stats within one server process. Either way, `event.waitUntil`
  // keeps the async call alive after the response is returned.
  if (isPersistentStoreConfigured()) {
    event.waitUntil(Promise.resolve(logHit(hit)));
  } else {
    const logUrl = new URL("/api/log", req.url);
    event.waitUntil(
      fetch(logUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(hit),
      }).catch(() => {
        /* best-effort telemetry; never fail the request over this */
      })
    );
  }

  // Surface the verdict via response headers so the live demo can show
  // *why* a request was classified the way it was, without extra calls.
  let res: NextResponse;
  if (verdict.isBot) {
    const bizarroUrl = new URL("/api/bizarro", req.url);
    bizarroUrl.searchParams.set("page", req.nextUrl.pathname);
    res = NextResponse.rewrite(bizarroUrl);
  } else {
    res = NextResponse.next();
  }

  res.headers.set("x-chimera-is-bot", String(verdict.isBot));
  res.headers.set("x-chimera-confidence", String(verdict.confidence));
  if (verdict.matchedIdentity) {
    res.headers.set("x-chimera-matched", verdict.matchedIdentity);
  }
  return res;
}
