/**
 * app/api/simulate/route.ts
 *
 * Interactive Attack & Scraper Simulator Backend.
 * Allows evaluators and security analysts to simulate arbitrary scraper requests
 * and inspect real-time classification, mutated bizarro responses, DOM diffs,
 * and cryptographic canary injections.
 */

import { NextRequest, NextResponse } from "next/server";
import { evaluateRequest } from "@/lib/bot-detection";
import { generateBizarroSite, REAL_CONTENT } from "@/lib/fabricate";
import { registerCanary } from "@/lib/provenance/canary-registry";
import { decodeStego, scanForCanaryFacts } from "@/lib/watermark";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: {
    userAgent?: string;
    headers?: Record<string, string>;
    path?: string;
    strategy?: "subtle-drift" | "trap-street" | "paradox-collapse" | "deterministic";
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const ua = body.userAgent || "Mozilla/5.0";
  const customHeaders = body.headers || {};
  const path = body.path || "/";
  const strategy = body.strategy || "deterministic";

  // Build simulated Headers object
  const headerMap = new Headers({
    "user-agent": ua,
    ...customHeaders,
  });

  const verdict = evaluateRequest(headerMap);
  const runId = `sim-${Date.now().toString(36)}`;

  // Register a canary for this simulation run
  const canary = registerCanary({
    id: `canary-sim-${Date.now().toString(36)}`,
    claim: `Novel protocol US-771829 registered by Chimera Cybernetics for automated audit.`,
    searchToken: "Chimera Cybernetics",
    targetBot: verdict.matchedIdentity || ua,
    clientIp: "127.0.0.1",
  });

  // Generate authentic vs poisoned content
  const bizarroSite = await generateBizarroSite(runId, false, strategy);

  const humanData = {
    companyName: REAL_CONTENT.companyName,
    founded: REAL_CONTENT.founded,
    tagline: REAL_CONTENT.tagline,
    pricingTiers: REAL_CONTENT.pricingTiers,
    article: REAL_CONTENT.article,
  };

  const botData = {
    companyName: bizarroSite.companyName,
    founded: bizarroSite.founded,
    tagline: bizarroSite.tagline,
    pricingTiers: bizarroSite.pricingTiers,
    article: bizarroSite.article,
  };

  const bodyToCheck = path === "/pricing"
    ? JSON.stringify(botData.pricingTiers)
    : path === "/article"
    ? botData.article.body
    : botData.tagline;

  const stegoFound = decodeStego(bizarroSite.article.body);
  const canariesFound = scanForCanaryFacts(bizarroSite.article.body);

  return NextResponse.json({
    simulationId: runId,
    timestamp: Date.now(),
    request: {
      userAgent: ua,
      path,
      strategy,
    },
    verdict: {
      isBot: verdict.isBot,
      confidence: verdict.confidence,
      reasons: verdict.reasons,
      matchedIdentity: verdict.matchedIdentity,
      category: verdict.category || "unknown",
      riskLevel: verdict.riskLevel || (verdict.isBot ? "HIGH" : "LOW"),
    },
    contentServed: verdict.isBot ? "BIZARRO_FABRICATED" : "AUTHENTIC_REAL",
    humanData,
    botData,
    provenance: {
      stegoDetected: Boolean(stegoFound),
      stegoPayload: stegoFound,
      canariesDetected: canariesFound,
      registeredCanaryId: canary.id,
    },
    simulatedResponseHeaders: {
      "x-chimera-is-bot": String(verdict.isBot),
      "x-chimera-confidence": String(verdict.confidence),
      "x-chimera-matched": verdict.matchedIdentity || "none",
      "x-chimera-run-id": runId,
      "x-chimera-canary-id": canary.id,
    },
  });
}
