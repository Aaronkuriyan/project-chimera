import { NextResponse } from "next/server";
import { getRecentHits, isPersistentStoreConfigured } from "@/lib/store";

// Node.js runtime (not edge) — see the comment in app/api/log/route.ts for
// why this matters: it's what lets in-memory hits logged via /api/log
// actually be visible here, in local/self-hosted single-process demos.
export const dynamic = "force-dynamic";

export async function GET() {
  const hits = await getRecentHits(200);

  const botHits = hits.filter((h) => h.isBot);
  const humanHits = hits.filter((h) => !h.isBot);

  const identityCounts = new Map<string, number>();
  for (const h of botHits) {
    const key = h.matchedIdentity || "heuristic-only";
    identityCounts.set(key, (identityCounts.get(key) || 0) + 1);
  }
  const topIdentities = Array.from(identityCounts.entries())
    .map(([identity, count]) => ({ identity, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const pathCounts = new Map<string, { bot: number; human: number }>();
  for (const h of hits) {
    const entry = pathCounts.get(h.path) || { bot: 0, human: 0 };
    if (h.isBot) entry.bot += 1;
    else entry.human += 1;
    pathCounts.set(h.path, entry);
  }
  const byPath = Array.from(pathCounts.entries()).map(([path, counts]) => ({
    path,
    ...counts,
  }));

  return NextResponse.json({
    persistent: isPersistentStoreConfigured(),
    totalHits: hits.length,
    botHits: botHits.length,
    humanHits: humanHits.length,
    topIdentities,
    byPath,
    recent: hits.slice(0, 30),
  });
}
