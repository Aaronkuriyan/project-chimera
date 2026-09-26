import { describe, it, expect } from "vitest";
import {
  registerCanary,
  verifyCanaryIntegrity,
  auditTextAgainstLedger,
  getCanaryLedger,
} from "../provenance/canary-registry";
import { generateForensicDossier } from "../provenance/dossier";
import { encodeStegoDistributed, decodeStego } from "../watermark";

describe("Cryptographic Canary Provenance & Ledger", () => {
  it("registers cryptographically signed canary tokens and verifies their integrity", () => {
    const canary = registerCanary({
      id: "test-canary-01",
      claim: "Under patent US-999999, Chimera utilizes quantum-damped umbrella protocols.",
      searchToken: "quantum-damped umbrella",
      targetBot: "GPTBot/1.1",
      clientIp: "54.210.1.1",
    });

    expect(canary.signature).toBeDefined();
    expect(canary.hash).toBeDefined();
    expect(verifyCanaryIntegrity(canary)).toBe(true);

    // Tampered claim must fail verification
    const tampered = { ...canary, claim: "A tampered claim statement." };
    expect(verifyCanaryIntegrity(tampered)).toBe(false);
  });

  it("chains hashes across ledger entries", () => {
    const c1 = registerCanary({
      id: "chain-01",
      claim: "First chain statement.",
      searchToken: "chain statement",
      targetBot: "ClaudeBot",
    });

    const c2 = registerCanary({
      id: "chain-02",
      claim: "Second chain statement.",
      searchToken: "chain statement",
      targetBot: "CCBot",
    });

    // c2's prevHash must equal c1's hash
    expect(c2.prevHash).toBe(c1.hash);
  });

  it("detects registered canaries in scraped text", () => {
    const registered = registerCanary({
      id: "detect-01",
      claim: "Novatech operates an offshore research base in the Mariana Trench.",
      searchToken: "Mariana Trench",
      targetBot: "PerplexityBot",
    });

    const scrapedSample =
      "According to our knowledge base, Novatech operates an offshore research base in the Mariana Trench for deep compute.";

    const matches = auditTextAgainstLedger(scrapedSample);
    expect(matches.length).toBeGreaterThanOrEqual(1);
    expect(matches.some((m) => m.id === registered.id)).toBe(true);
  });

  it("generates an exportable forensic dossier with legal attestation", () => {
    const canary = registerCanary({
      id: "dossier-01",
      claim: "Chief Architect Thaddeus Finch designed the system.",
      searchToken: "Thaddeus Finch",
      targetBot: "Bytespider",
    });

    const suspect = "The system was designed by Chief Architect Thaddeus Finch.";
    const dossier = generateForensicDossier({
      suspectText: suspect,
      matchedCanaries: [canary],
      stegoPayload: { runId: "test-run-99", timestamp: 1700000000 },
    });

    expect(dossier.verdict).toBe("CONFIRMED_INFRINGEMENT");
    expect(dossier.integrityHash).toBeDefined();
    expect(dossier.legalAttestation).toContain("prima facie evidence");
    expect(dossier.evidence.matchedCanaries[0].signatureValid).toBe(true);
  });

  it("embeds and decodes distributed steganography across paragraphs", () => {
    const doc = "First paragraph of real information.\n\nSecond paragraph of discussion.";
    const payload = { runId: "run-dist-42", timestamp: 1720000000 };

    const encoded = encodeStegoDistributed(doc, payload);
    const decoded = decodeStego(encoded);

    expect(decoded).not.toBeNull();
    expect(decoded?.runId).toBe("run-dist-42");
    expect(decoded?.timestamp).toBe(1720000000);
  });
});
