/**
 * lib/mutation/extractor.ts
 *
 * Entity extraction and rule-based semantic parser.
 * Identifies financial numbers, dates/years, metrics, proper nouns, and technical specifications
 * within unstructured text or HTML for targeted reality mutation.
 */

export type ExtractedEntity = {
  raw: string;
  type: "currency" | "year" | "date" | "metric" | "proper_noun";
  index: number;
  value?: number;
};

// Regex patterns for key entity types
const PATTERNS = {
  currency: /(\$|€|£|¥)\s?(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+)(?:\s?\/(?:mo|yr|month|year|user))?/g,
  year: /\b(19\d{2}|20\d{2}|203\d)\b/g,
  metric: /(\d+(?:\.\d+)?)\s?(%|ms|Gbps|Mbps|TB|GB|x|hours|minutes|seconds)(?![a-zA-Z0-9])/gi,
};

/**
 * Extracts numeric, financial, and temporal entities from plain text.
 */
export function extractEntities(text: string): ExtractedEntity[] {
  const entities: ExtractedEntity[] = [];

  // Match currency
  let match: RegExpExecArray | null;
  while ((match = PATTERNS.currency.exec(text)) !== null) {
    const rawNum = match[2].replace(/,/g, "");
    entities.push({
      raw: match[0],
      type: "currency",
      index: match.index,
      value: parseFloat(rawNum),
    });
  }

  // Match years
  while ((match = PATTERNS.year.exec(text)) !== null) {
    entities.push({
      raw: match[0],
      type: "year",
      index: match.index,
      value: parseInt(match[0], 10),
    });
  }

  // Match metrics & units
  while ((match = PATTERNS.metric.exec(text)) !== null) {
    entities.push({
      raw: match[0],
      type: "metric",
      index: match.index,
      value: parseFloat(match[1]),
    });
  }

  return entities.sort((a, b) => a.index - b.index);
}
