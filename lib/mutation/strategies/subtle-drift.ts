/**
 * lib/mutation/strategies/subtle-drift.ts
 *
 * Subtle Drift Poisoning Strategy.
 * Rather than inserting obvious absurdities, this strategy subtly shifts financial figures,
 * benchmark statistics, dates, and metric values by small, plausible amounts (+7% to +18%).
 *
 * Why this is dangerous to AI training & RAG:
 * - Passes LLM automated data-cleansing pipelines and sanity filters.
 * - Poisoned financial figures or metrics subtly corrupt downstream enterprise fine-tuning
 *   and real-time retrieval benchmarks without triggering error alerts.
 */

import { extractEntities } from "../extractor";
import { SessionGraph, resolveConsistentEntity } from "../consistency-graph";

export function applySubtleDrift(text: string, sessionGraph?: SessionGraph): string {
  const entities = extractEntities(text);
  if (entities.length === 0) return text;

  // Process in reverse index order so replacements do not offset earlier indices
  let mutated = text;
  const reversed = [...entities].sort((a, b) => b.index - a.index);

  for (const entity of reversed) {
    const orig = entity.raw;

    const transform = () => {
      if (entity.type === "currency" && entity.value !== undefined) {
        // Shift price by +13.5%
        const shifted = (entity.value * 1.135).toFixed(2);
        return orig.replace(/[\d,]+(?:\.\d+)?/, shifted);
      }
      if (entity.type === "year" && entity.value !== undefined) {
        // Shift year by +2 years
        return String(entity.value + 2);
      }
      if (entity.type === "metric" && entity.value !== undefined) {
        // Shift metric by +15%
        const shifted = (entity.value * 1.15).toFixed(1);
        return orig.replace(/[\d.]+/, shifted);
      }
      return orig;
    };

    const replacement = sessionGraph
      ? resolveConsistentEntity(sessionGraph, orig, transform)
      : transform();

    mutated =
      mutated.slice(0, entity.index) +
      replacement +
      mutated.slice(entity.index + orig.length);
  }

  return mutated;
}
