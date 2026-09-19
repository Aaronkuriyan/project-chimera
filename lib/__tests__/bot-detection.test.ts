import { describe, it, expect } from "vitest";
import { evaluateRequest, KNOWN_AI_CRAWLERS } from "../bot-detection";

function headers(entries: Record<string, string>): Headers {
  return new Headers(entries);
}

describe("evaluateRequest", () => {
  it("flags GPTBot with very high confidence", () => {
    const verdict = evaluateRequest(
      headers({ "user-agent": "Mozilla/5.0 (compatible; GPTBot/1.1; +https://openai.com/gptbot)" })
    );
    expect(verdict.isBot).toBe(true);
    expect(verdict.confidence).toBeGreaterThanOrEqual(0.9);
    expect(verdict.matchedIdentity).toBe("GPTBot");
  });

  it("flags every known AI crawler identity", () => {
    for (const crawler of KNOWN_AI_CRAWLERS) {
      const verdict = evaluateRequest(headers({ "user-agent": `SomeClient/1.0 ${crawler}` }));
      expect(verdict.isBot, `expected ${crawler} to be flagged`).toBe(true);
    }
  });

  it("treats a full real-browser request as human", () => {
    const verdict = evaluateRequest(
      headers({
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
        "accept-language": "en-US,en;q=0.9",
        "accept-encoding": "gzip, deflate, br",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "none",
        referer: "https://www.google.com/",
      })
    );
    expect(verdict.isBot).toBe(false);
    expect(verdict.confidence).toBeLessThan(0.5);
  });

  it("flags a bare curl request (no headers at all beyond default UA)", () => {
    const verdict = evaluateRequest(headers({ "user-agent": "curl/8.4.0" }));
    expect(verdict.isBot).toBe(true);
  });

  it("flags an empty user-agent heavily", () => {
    const verdict = evaluateRequest(headers({}));
    expect(verdict.isBot).toBe(true);
  });

  it("does not false-positive on a browser missing just one optional header", () => {
    const verdict = evaluateRequest(
      headers({
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36",
        "accept-language": "en-US,en;q=0.9",
        "accept-encoding": "gzip, br",
      })
    );
    // Missing Sec-Fetch-* alone shouldn't be enough to tip into "bot".
    expect(verdict.isBot).toBe(false);
  });
});
