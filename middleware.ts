import { NextRequest, NextResponse } from "next/server";
import { evaluateRequest } from "./lib/bot-detection";

export const config = {
  matcher: ["/", "/pricing", "/article"],
};

export function middleware(req: NextRequest) {
  const verdict = evaluateRequest(req.headers);

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
