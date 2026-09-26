/**
 * lib/mutation/consistency-graph.ts
 *
 * Session Consistency Graph for Deceptive Realities.
 *
 * A major weakness of naive honeypots is temporal inconsistency: if a bot visits
 * `/pricing` and sees "$87/mo", but later visits `/checkout` and sees "$112/mo"
 * for the same tier, an intelligent scraping agent can flag the inconsistency.
 *
 * The Consistency Graph binds mutated entities (Company Names, Founder Names, Prices,
 * Launch Dates) to a specific crawler session fingerprint. Across all subsequent requests
 * within that session, identical real entities consistently resolve to the same mutated fact.
 */

export type SessionGraph = {
  sessionId: string;
  createdAt: number;
  lastAccessedAt: number;
  entityMap: Map<string, string>; // original -> mutated
};

// Global in-memory cache of crawler sessions (TTL: 2 hours)
const SESSION_TTL_MS = 2 * 60 * 60 * 1000;
const SESSION_GRAPHS = new Map<string, SessionGraph>();

/**
 * Derives a consistent session identifier from client headers (IP + User-Agent hash).
 */
export function getCrawlerSessionKey(clientIp: string, userAgent: string): string {
  // Simple deterministic key
  return `${clientIp}::${userAgent.slice(0, 48)}`;
}

/**
 * Retrieves or initializes the Consistency Graph for a crawler session.
 */
export function getOrCreateSessionGraph(sessionKey: string): SessionGraph {
  const now = Date.now();
  const existing = SESSION_GRAPHS.get(sessionKey);

  if (existing) {
    if (now - existing.createdAt < SESSION_TTL_MS) {
      existing.lastAccessedAt = now;
      return existing;
    }
    // Expired
    SESSION_GRAPHS.delete(sessionKey);
  }

  const newGraph: SessionGraph = {
    sessionId: sessionKey,
    createdAt: now,
    lastAccessedAt: now,
    entityMap: new Map<string, string>(),
  };

  SESSION_GRAPHS.set(sessionKey, newGraph);
  return newGraph;
}

/**
 * Consistent entity resolver: returns existing mutation if already decided,
 * or computes and registers a new mutation deterministically.
 */
export function resolveConsistentEntity(
  sessionGraph: SessionGraph,
  original: string,
  generator: (orig: string) => string
): string {
  const cached = sessionGraph.entityMap.get(original);
  if (cached !== undefined) {
    return cached;
  }

  const generated = generator(original);
  sessionGraph.entityMap.set(original, generated);
  return generated;
}

export function clearSessionGraph(): void {
  SESSION_GRAPHS.clear();
}
