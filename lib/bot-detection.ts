/**
 * lib/bot-detection.ts
 *
 * Heuristic bot/AI-crawler detection.
 *
 * HONEST LIMITATION: Edge Middleware (Vercel/Next.js) does not expose raw
 * TLS handshake data, so true JA3/JA4 fingerprinting is not possible here.
 * What we *can* do reliably — and what actually catches GPTBot, ClaudeBot,
 * CCBot, PerplexityBot, and most scraping frameworks in the wild — is:
 *
 *   1. User-Agent substring matching against known AI-crawler identities
 *      (these bots self-identify by design, for the same reason they
 *      respect robots.txt in theory: crawler etiquette / discoverability).
 *   2. Header-shape heuristics: missing Accept-Language, missing
 *      Accept-Encoding br/gzip negotiation, absent Sec-Fetch-* client
 *      hints, no Referer on deep links — patterns real browsers almost
 *      never produce but HTTP client libraries (requests, axios, Scrapy,
 *      curl) frequently do.
 *   3. Request velocity (optional, requires a shared store like Upstash
 *      Redis or Vercel KV — see `lib/rate-store.ts` stub).
 *
 * If you deploy to Cloudflare Workers instead, swap in
 * `cloudflare-worker/index.ts`, which can additionally read
 * `request.cf.botManagement.score` (Cloudflare Enterprise Bot Management),
 * a real ML-based fingerprint score including TLS/JA3 signals.
 */

export type BotVerdict = {
  isBot: boolean;
  confidence: number; // 0-1
  reasons: string[];
  matchedIdentity?: string;
};

// Known AI-scraper / LLM-crawler user-agent substrings (case-insensitive).
// Extend this list as new crawlers emerge.
export const KNOWN_AI_CRAWLERS: string[] = [
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  "ClaudeBot",
  "Claude-Web",
  "anthropic-ai",
  "CCBot", // Common Crawl (feeds most foundation-model pretraining sets)
  "PerplexityBot",
  "Perplexity-User",
  "Bytespider", // ByteDance
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

// Generic scraping libraries / headless tooling — not AI-specific, but
// almost never a real human browsing session.
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

export function evaluateRequest(headers: Headers): BotVerdict {
  const ua = headers.get("user-agent") || "";
  const acceptLang = headers.get("accept-language");
  const acceptEnc = headers.get("accept-encoding");
  const secFetchMode = headers.get("sec-fetch-mode");
  const secFetchSite = headers.get("sec-fetch-site");
  const referer = headers.get("referer");

  const reasons: string[] = [];
  let score = 0;

  // 1. Direct identity match — highest confidence signal.
  const aiMatch = matchAny(ua, KNOWN_AI_CRAWLERS);
  if (aiMatch) {
    reasons.push(`User-Agent self-identifies as known AI crawler: "${aiMatch}"`);
    return { isBot: true, confidence: 0.98, reasons, matchedIdentity: aiMatch };
  }

  const genericMatch = matchAny(ua, GENERIC_BOT_UA_SUBSTRINGS);
  if (genericMatch) {
    reasons.push(`User-Agent matches known HTTP client / headless tool: "${genericMatch}"`);
    score += 0.6;
  }

  // 2. Header-shape heuristics (each is weak alone, additive together).
  if (!acceptLang) {
    reasons.push("Missing Accept-Language header (real browsers always send this)");
    score += 0.15;
  }
  if (!acceptEnc || !/br|gzip/i.test(acceptEnc)) {
    reasons.push("Missing/unusual Accept-Encoding negotiation");
    score += 0.1;
  }
  if (!secFetchMode && !secFetchSite) {
    reasons.push("No Sec-Fetch-* client hints (absent from most non-browser HTTP clients)");
    score += 0.15;
  }
  if (!referer && !ua) {
    reasons.push("No Referer and no User-Agent at all");
    score += 0.2;
  }
  if (!ua) {
    reasons.push("Empty User-Agent");
    score += 0.3;
  }

  score = Math.min(score, 0.95);

  return {
    isBot: score >= 0.5,
    confidence: Number(score.toFixed(2)),
    reasons,
    matchedIdentity: genericMatch,
  };
}
