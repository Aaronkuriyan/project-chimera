/**
 * lib/provenance/dossier.ts
 *
 * Forensic Infringement Dossier Generator.
 * Compiles cryptographic evidence, crawler classification data, and canary matches
 * into an exportable, court-ready IP Infringement Dossier.
 */

import { CanaryLedgerEntry, verifyCanaryIntegrity } from "./canary-registry";
import { WatermarkPayload } from "../watermark";
import { createHash } from "crypto";

export type ForensicDossier = {
  dossierId: string;
  generatedAt: string;
  verdict: "CONFIRMED_INFRINGEMENT" | "SUSPECTED_REPUBLISHING" | "NO_EVIDENCE";
  integrityHash: string;
  evidence: {
    matchedCanaries: Array<{
      id: string;
      claim: string;
      originalTargetBot: string;
      injectedAt: string;
      cryptographicSignature: string;
      signatureValid: boolean;
    }>;
    steganographyPayload?: {
      runId: string;
      embeddedTimestamp: string;
    };
    suspectTextSnippet: string;
    suspectTextHash: string;
  };
  legalAttestation: string;
};

export function generateForensicDossier(params: {
  suspectText: string;
  matchedCanaries: CanaryLedgerEntry[];
  stegoPayload?: WatermarkPayload | null;
}): ForensicDossier {
  const now = new Date();
  const dossierId = `CHIMERA-DOSSIER-${now.getTime().toString(36).toUpperCase()}`;

  const textHash = createHash("sha256").update(params.suspectText).digest("hex");

  const formattedCanaries = params.matchedCanaries.map((c) => ({
    id: c.id,
    claim: c.claim,
    originalTargetBot: c.targetBot,
    injectedAt: new Date(c.timestamp).toISOString(),
    cryptographicSignature: c.signature,
    signatureValid: verifyCanaryIntegrity(c),
  }));

  const hasCanary = formattedCanaries.length > 0;
  const hasStego = Boolean(params.stegoPayload);

  let verdict: ForensicDossier["verdict"] = "NO_EVIDENCE";
  if (hasCanary) {
    verdict = "CONFIRMED_INFRINGEMENT";
  } else if (hasStego) {
    verdict = "SUSPECTED_REPUBLISHING";
  }

  const dossierHash = createHash("sha256")
    .update(`${dossierId}|${textHash}|${verdict}|${params.matchedCanaries.length}`)
    .digest("hex");

  return {
    dossierId,
    generatedAt: now.toISOString(),
    verdict,
    integrityHash: dossierHash,
    evidence: {
      matchedCanaries: formattedCanaries,
      steganographyPayload: params.stegoPayload
        ? {
            runId: params.stegoPayload.runId,
            embeddedTimestamp: new Date(params.stegoPayload.timestamp * 1000).toISOString(),
          }
        : undefined,
      suspectTextSnippet: params.suspectText.slice(0, 300),
      suspectTextHash: textHash,
    },
    legalAttestation:
      "This document certifies that the aforementioned factual claims were synthetically engineered, " +
      "cryptographically signed, and exclusively served to identified automated scraping entities. " +
      "Reproduction of these unique synthetic claims constitutes prima facie evidence of unauthorized data ingestion.",
  };
}
