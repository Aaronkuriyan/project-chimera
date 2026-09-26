/**
 * lib/detection/header-fingerprint.ts
 *
 * Evaluates HTTP client header shape, entropy, and ordering signals.
 * Real browsers adhere to standard header behaviors and send standard Client Hints,
 * while automated scraping tools and basic HTTP libraries exhibit distinct omissions.
 */

export type HeaderAnomalyScore = {
  score: number; // 0.0 (strictly human browser) to 1.0 (definite automated client)
  anomalies: string[];
  clientHintPresent: boolean;
  browserProfileConfidence: number;
};

export function analyzeHeaderEntropy(headers: Headers): HeaderAnomalyScore {
  const anomalies: string[] = [];
  let score = 0;

  const ua = headers.get("user-agent") || "";
  const acceptLang = headers.get("accept-language");
  const acceptEnc = headers.get("accept-encoding");
  const secFetchMode = headers.get("sec-fetch-mode");
  const secFetchSite = headers.get("sec-fetch-site");
  const referer = headers.get("referer");

  // 1. User Agent Evaluation
  if (!ua) {
    anomalies.push("Empty or missing User-Agent header");
    score += 0.35;
  }

  // 2. Language & Localization Negotiation (Real browsers almost universally include this)
  if (!acceptLang) {
    anomalies.push("Missing Accept-Language header (real browsers always send this)");
    score += 0.15;
  }

  // 3. Compression Negotiation (gzip/br)
  if (!acceptEnc || !/br|gzip/i.test(acceptEnc)) {
    anomalies.push("Missing or unusual stream compression negotiation (br/gzip)");
    score += 0.10;
  }

  // 4. W3C Fetch Metadata hints
  if (!secFetchMode && !secFetchSite) {
    anomalies.push("No Sec-Fetch-* client hints (absent from most non-browser HTTP clients)");
    score += 0.15;
  }

  // 5. Total absence of context
  if (!referer && !ua) {
    anomalies.push("No Referer and no User-Agent at all");
    score += 0.20;
  }

  const normalizedScore = Number(Math.min(score, 0.95).toFixed(2));
  const browserProfileConfidence = Number((1.0 - normalizedScore).toFixed(2));

  return {
    score: normalizedScore,
    anomalies,
    clientHintPresent: Boolean(secFetchMode || secFetchSite),
    browserProfileConfidence,
  };
}
