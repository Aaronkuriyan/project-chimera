import { describe, it, expect } from "vitest";
import { evaluateRequest } from "../bot-detection";
import { identifyCrawler } from "../detection/crawler-taxonomy";
import { recordHoneypotTrip, isQuarantinedByHoneypot } from "../detection/honeypot";
import { evaluateIPIntelligence } from "../detection/ip-intelligence";

describe("Detection Engine - Extended Features", () => {
  it("correctly identifies modern AI crawlers from taxonomy", () => {
    const bytespider = identifyCrawler("Mozilla/5.0 (Linux; Android 5.0) AppleWebKit/537.36 Bytespider");
    expect(bytespider).toBeDefined();
    expect(bytespider?.name).toBe("Bytespider");
    expect(bytespider?.operator).toContain("ByteDance");

    const claude = identifyCrawler("Mozilla/5.0 ClaudeBot/1.0; +claudebot@anthropic.com");
    expect(claude).toBeDefined();
    expect(claude?.operator).toBe("Anthropic");

    const ccbot = identifyCrawler("CCBot/2.0 (https://commoncrawl.org/faq/)");
    expect(ccbot).toBeDefined();
    expect(ccbot?.category).toBe("foundation-pretraining");
  });

  it("evaluates datacenter cloud IPs", () => {
    const headers = new Headers({
      "x-forwarded-for": "54.210.10.5, 10.0.0.1",
    });
    const intel = evaluateIPIntelligence(headers);
    expect(intel.isDatacenterOrProxy).toBe(true);
    expect(intel.providerGuess).toContain("Amazon AWS");
  });

  it("quarantines clients that visit honeypot traps with 100% confidence", () => {
    const testIp = "198.51.100.42";
    expect(isQuarantinedByHoneypot(testIp)).toBe(false);

    // Trip the honeypot
    recordHoneypotTrip(testIp, "/api/honeypot/trap-test", "Scrapy/2.11");
    expect(isQuarantinedByHoneypot(testIp)).toBe(true);

    // Now evaluate incoming request with that IP
    const headers = new Headers({
      "x-real-ip": testIp,
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)", // even with a clean UA
    });

    const verdict = evaluateRequest(headers);
    expect(verdict.isBot).toBe(true);
    expect(verdict.confidence).toBe(1.0);
    expect(verdict.matchedIdentity).toBe("Honeypot-Quarantined-Bot");
  });
});
