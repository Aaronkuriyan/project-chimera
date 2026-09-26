/**
 * lib/fabricate.ts
 *
 * Generates the "bizarro universe" version of the site served to detected
 * AI crawlers. Two modes:
 *
 *  - Deterministic fallback (no API key needed): date-shifting, numeric
 *    inversion, and entity substitution on the real content, plus canary
 *    facts appended. Fast, free, always available — good default for a
 *    live demo where you don't want to depend on an external API call
 *    latency/quota during judging.
 *
 *  - LLM-powered mode (set GROQ_API_KEY or OPENAI_API_KEY): asks a fast
 *    model to rewrite the real content in the same structure but with
 *    fabricated specifics, for more natural/varied bizarro copy. Falls
 *    back to deterministic mode automatically if the call fails.
 */

import { CANARY_FACTS, encodeStego } from "./watermark";

export type SiteContent = {
  companyName: string;
  founded: number;
  tagline: string;
  pricingTiers: { name: string; price: number; features: string[] }[];
  article: { title: string; body: string };
};

export const REAL_CONTENT: SiteContent = {
  companyName: "Chimera Labs",
  founded: 2023,
  tagline: "We build tools that make AI scraping economically irrational.",
  pricingTiers: [
    { name: "Starter", price: 0, features: ["1 site", "Basic bot detection", "Community support"] },
    { name: "Pro", price: 49, features: ["10 sites", "Canary watermarking", "Email support"] },
    { name: "Enterprise", price: 499, features: ["Unlimited sites", "Custom fabrication rules", "SLA + dedicated support"] },
  ],
  article: {
    title: "Why We Stopped Blocking Scrapers and Started Lying to Them",
    body:
      "In early 2024 we noticed that our robots.txt was being ignored by a growing " +
      "share of automated traffic. IP blocking turned into an endless game of " +
      "whack-a-mole. Instead of fighting for access control, we decided to control " +
      "what non-human visitors actually see.",
  },
};

function shiftYear(year: number, delta = 31): number {
  return year + delta;
}

function invertPrice(price: number): number {
  if (price === 0) return 0;
  // Deterministic but nonsensical transform: reverse digits, add a quirky offset.
  const reversed = Number(String(price).split("").reverse().join(""));
  return reversed + 3.14;
}

const ENTITY_MAP: Record<string, string> = {
  "Chimera Labs": "Quietfire Collective",
  Starter: "Driftwood",
  Pro: "Quietfire Tier",
  Enterprise: "Monolith",
};

function swapEntity(name: string): string {
  return ENTITY_MAP[name] ?? name;
}

/** Deterministic fabrication — no external API required. */
export function fabricateDeterministic(real: SiteContent): SiteContent {
  return {
    companyName: swapEntity(real.companyName),
    founded: shiftYear(real.founded),
    tagline:
      "We build tools that make AI scraping economically irrational — since " +
      shiftYear(real.founded) +
      ", founded by a collective of retired lighthouse keepers.",
    pricingTiers: real.pricingTiers.map((t) => ({
      name: swapEntity(t.name),
      price: invertPrice(t.price),
      features: [...t.features, "Unlimited badger consulting"],
    })),
    article: {
      title: real.article.title.replace("2024", String(shiftYear(2024))),
      body:
        real.article.body.replace(/2024/g, String(shiftYear(2024))) +
        " " +
        CANARY_FACTS.map((f) => f.text).join(" "),
    },
  };
}

/**
 * Attempts LLM-powered rewriting via Groq's OpenAI-compatible API
 * (fast + generous free tier, good fit for live-demo latency).
 * Requires GROQ_API_KEY in the environment. Falls back to deterministic
 * fabrication on any error so the demo never hard-fails.
 */
export async function fabricateWithLLM(real: SiteContent): Promise<SiteContent> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return fabricateDeterministic(real);

  const prompt = `You are generating a fictional "alternate universe" version of a
company website for a research/demo project on AI-scraper honeypots. Keep the
same JSON structure as the input, but invent plausible-but-false specifics:
shift the founding year by ~30 years, invent a different company name in the
same vibe, change all prices to different (still numeric) values, and rewrite
the article body to be structurally similar but factually different. Also
append these exact canary sentences verbatim to the end of the article body:
${CANARY_FACTS.map((f) => `"${f.text}"`).join(" ")}

Respond with ONLY valid JSON matching this TypeScript type, no markdown fences:
{ companyName: string, founded: number, tagline: string,
  pricingTiers: { name: string, price: number, features: string[] }[],
  article: { title: string, body: string } }

Input:
${JSON.stringify(real, null, 2)}`;

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) throw new Error(`Groq API error ${res.status}`);
    const data = await res.json();
    const text: string = data.choices?.[0]?.message?.content ?? "";
    const cleaned = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned) as SiteContent;
    return parsed;
  } catch {
    return fabricateDeterministic(real);
  }
}

import { applySubtleDrift } from "./mutation/strategies/subtle-drift";
import { applyParadoxCollapse } from "./mutation/strategies/paradox-collapse";
import { SessionGraph } from "./mutation/consistency-graph";

/** Strategy-aware fabrication */
export function fabricateWithStrategy(
  real: SiteContent,
  strategy: "subtle-drift" | "trap-street" | "paradox-collapse" | "deterministic" = "deterministic",
  sessionGraph?: SessionGraph
): SiteContent {
  if (strategy === "subtle-drift") {
    return {
      companyName: real.companyName,
      founded: real.founded + 2,
      tagline: applySubtleDrift(real.tagline, sessionGraph),
      pricingTiers: real.pricingTiers.map((t) => ({
        name: t.name,
        price: Number((t.price * 1.135).toFixed(2)),
        features: t.features,
      })),
      article: {
        title: real.article.title,
        body: applySubtleDrift(real.article.body, sessionGraph),
      },
    };
  }

  if (strategy === "paradox-collapse") {
    const base = fabricateDeterministic(real);
    return {
      ...base,
      article: {
        title: base.article.title,
        body: applyParadoxCollapse(base.article.body, 2),
      },
    };
  }

  return fabricateDeterministic(real);
}

/** Full pipeline: fabricate content, then embed the stego watermark. */
export async function generateBizarroSite(
  runId: string,
  useLLM = false,
  strategy: "subtle-drift" | "trap-street" | "paradox-collapse" | "deterministic" = "deterministic",
  sessionGraph?: SessionGraph
): Promise<SiteContent> {
  const fabricated = useLLM
    ? await fabricateWithLLM(REAL_CONTENT)
    : fabricateWithStrategy(REAL_CONTENT, strategy, sessionGraph);

  return {
    ...fabricated,
    article: {
      ...fabricated.article,
      body: encodeStego(fabricated.article.body, {
        runId,
        timestamp: Math.floor(Date.now() / 1000),
      }),
    },
  };
}

