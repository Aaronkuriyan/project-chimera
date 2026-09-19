/**
 * lib/store.ts
 *
 * Persistence layer for bot-hit telemetry, powering the /dashboard and
 * /api/stats endpoints.
 *
 * Production: Upstash Redis (REST API — works from the Edge runtime,
 * unlike traditional Redis clients which need a raw TCP socket). Set
 * UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN (free tier at
 * upstash.com) and hits persist across deploys/regions.
 *
 * Local dev / no env vars set: falls back to an in-memory ring buffer.
 * This is per-instance and resets on redeploy — fine for `npm run dev`
 * and for demoing locally, but won't share state across serverless
 * invocations in production. The code path is identical either way, so
 * flipping on real persistence later is just setting two env vars.
 */

export type Hit = {
  ts: number; // unix millis
  path: string;
  isBot: boolean;
  confidence: number;
  matchedIdentity?: string;
  reasons: string[];
};

const MAX_HITS = 500;

// --- in-memory fallback -----------------------------------------------
let memoryHits: Hit[] = [];

function memoryLog(hit: Hit) {
  memoryHits.push(hit);
  if (memoryHits.length > MAX_HITS) {
    memoryHits = memoryHits.slice(memoryHits.length - MAX_HITS);
  }
}

function memoryRecent(limit: number): Hit[] {
  return memoryHits.slice(-limit).reverse();
}

// --- Upstash Redis REST client -----------------------------------------
const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const REDIS_KEY = "chimera:hits";

function hasUpstash(): boolean {
  return Boolean(UPSTASH_URL && UPSTASH_TOKEN);
}

async function redisCommand(command: (string | number)[]): Promise<unknown> {
  const res = await fetch(`${UPSTASH_URL}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${UPSTASH_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });
  if (!res.ok) throw new Error(`Upstash error ${res.status}`);
  const data = await res.json();
  return data.result;
}

async function redisLog(hit: Hit) {
  // LPUSH + LTRIM keeps the list capped at MAX_HITS, newest first.
  await redisCommand(["LPUSH", REDIS_KEY, JSON.stringify(hit)]);
  await redisCommand(["LTRIM", REDIS_KEY, 0, MAX_HITS - 1]);
}

async function redisRecent(limit: number): Promise<Hit[]> {
  const raw = (await redisCommand(["LRANGE", REDIS_KEY, 0, limit - 1])) as string[];
  return raw.map((r) => JSON.parse(r) as Hit);
}

// --- public API ----------------------------------------------------------

/** Fire-and-forget logging — never throws, never blocks the response. */
export function logHit(hit: Hit): void {
  if (hasUpstash()) {
    redisLog(hit).catch((err) => console.error("[chimera] redis log failed:", err));
  } else {
    memoryLog(hit);
  }
}

export async function getRecentHits(limit = 100): Promise<Hit[]> {
  if (hasUpstash()) {
    try {
      return await redisRecent(limit);
    } catch (err) {
      console.error("[chimera] redis read failed, falling back to memory:", err);
      return memoryRecent(limit);
    }
  }
  return memoryRecent(limit);
}

export function isPersistentStoreConfigured(): boolean {
  return hasUpstash();
}
