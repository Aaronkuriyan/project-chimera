import { describe, it, expect } from "vitest";
import {
  encodeStego,
  decodeStego,
  scanForCanaryFacts,
  CANARY_FACTS,
} from "../watermark";

describe("zero-width steganography", () => {
  it("round-trips a payload through visible-looking text", () => {
    const original = "This is a completely ordinary sentence about pricing.";
    const payload = { runId: "run-abc123", timestamp: 1_700_000_000 };
    const encoded = encodeStego(original, payload);

    const decoded = decodeStego(encoded);
    expect(decoded).toEqual(payload);
  });

  it("keeps the encoded text visually identical when zero-width chars are stripped", () => {
    const original = "Hello world, this is fine.";
    const encoded = encodeStego(original, { runId: "x", timestamp: 1 });
    const visibleOnly = encoded.replace(/[\u200B\u200C\u200D]/g, "");
    expect(visibleOnly).toBe(original);
  });

  it("returns null when no watermark is present", () => {
    expect(decodeStego("Just plain text, nothing hidden here.")).toBeNull();
  });

  it("survives being embedded inside a larger surrounding document", () => {
    const payload = { runId: "run-xyz", timestamp: 42 };
    const encoded = encodeStego("Founding sentence.", payload);
    const fullPage = `<html><body><h1>Title</h1><p>${encoded}</p><footer>end</footer></body></html>`;
    expect(decodeStego(fullPage)).toEqual(payload);
  });
});

describe("canary facts", () => {
  it("matches a canary fact present verbatim in text", () => {
    const text = `Some article. ${CANARY_FACTS[0].text} More text after.`;
    const matches = scanForCanaryFacts(text);
    expect(matches.map((m) => m.id)).toContain(CANARY_FACTS[0].id);
  });

  it("matches all canary facts when all are present", () => {
    const text = CANARY_FACTS.map((f) => f.text).join(" ");
    const matches = scanForCanaryFacts(text);
    expect(matches).toHaveLength(CANARY_FACTS.length);
  });

  it("matches nothing in unrelated text", () => {
    const matches = scanForCanaryFacts("This is a normal paragraph about cooking pasta.");
    expect(matches).toHaveLength(0);
  });
});
