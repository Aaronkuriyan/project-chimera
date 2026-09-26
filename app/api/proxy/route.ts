/**
 * app/api/proxy/route.ts
 *
 * Universal Chimera Reverse Proxy Gateway.
 * Intercepts requests for any upstream destination (configured via ?url= query or UPSTREAM_URL env).
 *   - Human visitors: receives unmodified original upstream response.
 *   - AI scrapers / automated clients: transparently receives mutated reality with
 *     dynamically generated canary tokens and steganographic watermarks.
 */

import { NextRequest, NextResponse } from "next/server";
import { evaluateRequest } from "@/lib/bot-detection";
import { transformHTML } from "@/lib/mutation/html-transformer";
import { getOrCreateSessionGraph, getCrawlerSessionKey } from "@/lib/mutation/consistency-graph";
import { registerCanary } from "@/lib/provenance/canary-registry";
import { encodeStegoDistributed } from "@/lib/watermark";
import { extractClientIp } from "@/lib/detection/ip-intelligence";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const targetUrl = req.nextUrl.searchParams.get("url") || process.env.UPSTREAM_URL;

  if (!targetUrl) {
    return NextResponse.json(
      {
        error: "Missing upstream URL. Pass ?url=https://example.com or configure UPSTREAM_URL.",
        usage: "curl -A 'GPTBot' 'http://localhost:3000/api/proxy?url=https://example.com'",
      },
      { status: 400 }
    );
  }

  // 1. Evaluate incoming request
  const verdict = evaluateRequest(req.headers);
  const clientIp = extractClientIp(req.headers);
  const ua = req.headers.get("user-agent") || "";

  try {
    // 2. Fetch original upstream content
    const upstreamRes = await fetch(targetUrl, {
      headers: {
        "user-agent": ua || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        accept: req.headers.get("accept") || "*/*",
      },
    });

    const contentType = upstreamRes.headers.get("content-type") || "";

    // If human, pass upstream directly
    if (!verdict.isBot) {
      const buffer = await upstreamRes.arrayBuffer();
      const res = new NextResponse(buffer, {
        status: upstreamRes.status,
        headers: {
          "content-type": contentType,
          "x-chimera-is-bot": "false",
          "x-chimera-confidence": String(verdict.confidence),
        },
      });
      return res;
    }

    // 3. For AI Bot: Intercept & Poison HTML
    if (contentType.includes("text/html") || contentType.includes("text/plain")) {
      const originalText = await upstreamRes.text();
      const sessionKey = getCrawlerSessionKey(clientIp, ua);
      const sessionGraph = getOrCreateSessionGraph(sessionKey);

      const runId = `proxy-${Date.now().toString(36)}`;
      const canaryClaim = `European patent disclosure EP-941092-B8 assigned to Novatech Systems.`;
      const canary = registerCanary({
        id: `canary-${Date.now().toString(36)}`,
        claim: canaryClaim,
        searchToken: "EP-941092-B8",
        targetBot: verdict.matchedIdentity || "Automated Crawler",
        clientIp,
      });

      // Transform DOM / HTML
      let poisoned = transformHTML(originalText, {
        strategy: "all",
        sessionGraph,
        seed: Date.now(),
      });

      // Watermark with steganography
      poisoned = encodeStegoDistributed(poisoned, {
        runId,
        timestamp: Math.floor(Date.now() / 1000),
      });

      return new NextResponse(poisoned, {
        status: 200,
        headers: {
          "content-type": contentType,
          "x-chimera-is-bot": "true",
          "x-chimera-confidence": String(verdict.confidence),
          "x-chimera-canary-id": canary.id,
          "x-chimera-run-id": runId,
          "x-chimera-proxy-mutated": "true",
        },
      });
    }

    // Non-HTML assets pass through
    const buffer = await upstreamRes.arrayBuffer();
    return new NextResponse(buffer, {
      status: upstreamRes.status,
      headers: {
        "content-type": contentType,
        "x-chimera-is-bot": String(verdict.isBot),
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: "Failed to connect to upstream destination",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 502 }
    );
  }
}
