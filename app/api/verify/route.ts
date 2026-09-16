import { NextRequest, NextResponse } from "next/server";
import { decodeStego, scanForCanaryFacts } from "@/lib/watermark";

export const runtime = "edge";

/**
 * POST { text: string }
 *
 * Paste in any suspect output (e.g. an LLM completion) and this checks for:
 *  - an embedded zero-width stego payload (proves verbatim republishing)
 *  - any matched canary facts (suggestive evidence of training exposure)
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
  const canaryMatches = scanForCanaryFacts(text);

  return NextResponse.json({
    stegoWatermarkFound: Boolean(stego),
    stegoPayload: stego,
    canaryFactsMatched: canaryMatches,
    verdict:
      stego || canaryMatches.length > 0
        ? "This text shows evidence of originating from a Chimera-fabricated page."
        : "No watermark or canary facts detected in this text.",
  });
}
