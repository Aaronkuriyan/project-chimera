/**
 * lib/bot-detection.ts
 *
 * Multi-Signal Defense-in-Depth Bot Detection Engine.
 * Evaluates incoming requests across 4 distinct signal layers:
 *   1. Identity matching against 150+ known AI crawlers and scraping frameworks.
 *   2. Header-shape and entropy analysis (Client Hints, Accept encoding, ordering).
 *   3. Datacenter ASN & cloud subnet IP intelligence.
 *   4. Behavioral honeypot trap quarantine verification.
 */

import { identifyCrawler, CrawlerProfile, CRAWLER_TAXONOMY } from "./detection/crawler-taxonomy";
import { analyzeHeaderEntropy, HeaderAnomalyScore } from "./detection/header-fingerprint";
import { evaluateIPIntelligence, IPIntelligenceResult, extractClientIp } from "./detection/ip-intelligence";
import { isQuarantinedByHoneypot } from "./detection/honeypot";

export type BotVerdict = {
  isBot: boolean;
  confidence: number; // 0.0 - 1.0
  reasons: string[];
  matchedIdentity?: string;
  category?: string;
  riskLevel?: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  headerScore?: number;
  ipIntel?: IPIntelligenceResult;
  profile?: CrawlerProfile;
};

// Exported for backwards compatibility with tests and existing imports
export const KNOWN_AI_CRAWLERS: string[] = [
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  "ClaudeBot",
  "Claude-Web",
  "anthropic-ai",
  "CCBot",
  "PerplexityBot",
  "Perplexity-User",
  "Bytespider",
  "Google-Extended",
  "GoogleOther",
  "Applebot-Extended",
  "Diffbot",
  "Omgilibot",
  "Omgili",
  "FacebookBot",
  "meta-externalagent",
  "ImagesiftBot",
  "Amazonbot",
  "YouBot",
  "cohere-ai",
  "AI2Bot",
  "Timpibot",
  "SemrushBot",
];

const GENERIC_BOT_UA_SUBSTRINGS: string[] = [
  "python-requests",
  "python-urllib",
  "Scrapy",
  "axios/",
  "node-fetch",
  "go-http-client",
  "curl/",
  "Wget/",
  "HeadlessChrome",
  "PhantomJS",
  "Puppeteer",
  "Playwright",
  "okhttp",
  "libwww-perl",
  "Java/",
];

function matchAny(haystack: string, needles: string[]): string | undefined {
  const lower = haystack.toLowerCase();
  return needles.find((n) => lower.includes(n.toLowerCase()));
}

/**
 * Evaluates an incoming HTTP request using multi-signal probabilistic scoring.
 */
export function evaluateRequest(headers: Headers): BotVerdict {
  const ua = headers.get("user-agent") || "";
  const reasons: string[] = [];
  const clientIp = extractClientIp(headers);

  // 1. Check Behavioral Honeypot Quarantine (Absolute certainty: 1.0)
  if (isQuarantinedByHoneypot(clientIp)) {
    reasons.push(`Quarantined: Client IP ${clientIp} previously accessed an invisible honeypot trap.`);
    return {
      isBot: true,
      confidence: 1.0,
      reasons,
      matchedIdentity: "Honeypot-Quarantined-Bot",
      category: "stealth-framework",
      riskLevel: "CRITICAL",
    };
  }

  // 2. Identify Crawler via Extended Taxonomy
  const knownProfile = identifyCrawler(ua);
  if (knownProfile) {
    reasons.push(
      `User-Agent identified as ${knownProfile.name} (${knownProfile.operator}) — [${knownProfile.category}]`
    );
    return {
      isBot: true,
      confidence: knownProfile.riskLevel === "CRITICAL" ? 0.99 : 0.95,
      reasons,
      matchedIdentity: knownProfile.name,
      category: knownProfile.category,
      riskLevel: knownProfile.riskLevel,
      profile: knownProfile,
    };
  }

  // Fallback direct identity check for compatibility with legacy tests
  const legacyAiMatch = matchAny(ua, KNOWN_AI_CRAWLERS);
  if (legacyAiMatch) {
    reasons.push(`User-Agent self-identifies as known AI crawler: "${legacyAiMatch}"`);
    return {
      isBot: true,
      confidence: 0.98,
      reasons,
      matchedIdentity: legacyAiMatch,
      category: "foundation-pretraining",
      riskLevel: "CRITICAL",
    };
  }

  let totalScore = 0;

  // 3. Generic Scraping Tool / Library Signatures
  const genericMatch = matchAny(ua, GENERIC_BOT_UA_SUBSTRINGS);
  if (genericMatch) {
    reasons.push(`User-Agent matches known HTTP client / headless tool: "${genericMatch}"`);
    totalScore += 0.6;
  }

  // 4. Header Entropy & Shape Heuristics
  const headerAnalysis: HeaderAnomalyScore = analyzeHeaderEntropy(headers);
  if (headerAnalysis.anomalies.length > 0) {
    for (const anomaly of headerAnalysis.anomalies) {
      reasons.push(anomaly);
    }
    totalScore += headerAnalysis.score;
  }

  // 5. Cloud Subnet & Datacenter IP Intelligence
  const ipIntel = evaluateIPIntelligence(headers);
  if (ipIntel.isDatacenterOrProxy) {
    if (ipIntel.reason) reasons.push(ipIntel.reason);
    totalScore += ipIntel.scoreAdjustment;
  }

  // Normalize confidence between 0 and 0.99
  const confidence = Number(Math.min(totalScore, 0.99).toFixed(2));
  const isBot = confidence >= 0.5;

  return {
    isBot,
    confidence,
    reasons,
    matchedIdentity: genericMatch || (isBot ? "Unidentified Automated Client" : undefined),
    headerScore: headerAnalysis.score,
    ipIntel,
  };
}
