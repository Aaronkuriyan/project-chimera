import { NextRequest, NextResponse } from "next/server";
import { decodeStego, scanForCanaryFacts } from "@/lib/watermark";
import { auditTextAgainstLedger } from "@/lib/provenance/canary-registry";
import { generateForensicDossier } from "@/lib/provenance/dossier";

export const runtime = "nodejs";

/**
 * POST { text: string }
 *
 * Scans suspect text (e.g. an LLM output or scraped web page) for:
 *  - Embedded zero-width steganographic watermarks
 *  - Static canary facts
 *  - Cryptographic canary ledger matches
 *  - Generates a court-ready cryptographic Forensic Dossier
 */
export async function POST(req: NextRequest) {
  let body: { text?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const text = body.text ?? "";
  if (!text.trim()) {
    return NextResponse.json({ error: "Missing 'text' field" }, { status: 400 });
  }

  const stego = decodeStego(text);
  const staticCanaryMatches = scanForCanaryFacts(text);
  const ledgerMatches = auditTextAgainstLedger(text);

  // Combine matches
  const allCanaryMatches = [
    ...staticCanaryMatches,
    ...ledgerMatches.map((l) => ({ id: l.id, text: l.claim })),
  ];

  // Remove duplicate canary texts
  const uniqueCanaries = Array.from(
    new Map(allCanaryMatches.map((item) => [item.text, item])).values()
  );

  // Compile forensic dossier
  const dossier = generateForensicDossier({
    suspectText: text,
    matchedCanaries: ledgerMatches,
    stegoPayload: stego,
  });

  const hasEvidence = Boolean(stego) || uniqueCanaries.length > 0;

  return NextResponse.json({
    stegoWatermarkFound: Boolean(stego),
    stegoPayload: stego,
    canaryFactsMatched: uniqueCanaries,
    ledgerMatchesCount: ledgerMatches.length,
    dossier,
    verdict: hasEvidence
      ? "Cryptographic provenance confirmed: This text originates from a Chimera-poisoned payload."
      : "No watermark or canary facts detected in this text.",
  });
}
