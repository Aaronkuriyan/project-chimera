/**
 * app/api/canaries/route.ts
 *
 * Canary Ledger API endpoint.
 * Returns the active tamper-evident ledger of registered canaries.
 */

import { NextResponse } from "next/server";
import { getCanaryLedger } from "@/lib/provenance/canary-registry";

export const runtime = "nodejs";

export async function GET() {
  const canaries = getCanaryLedger();
  return NextResponse.json({
    total: canaries.length,
    canaries,
  });
}
