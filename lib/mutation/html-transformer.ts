/**
 * lib/mutation/html-transformer.ts
 *
 * Universal HTML DOM Transformer.
 * Allows Chimera to act as a transparent proxy for ANY external website.
 * Parses arbitrary HTML documents, separates visible text nodes from HTML tags/scripts/styles,
 * applies reality mutation and steganographic watermarking strictly to human-visible text,
 * and reconstructs the valid HTML document.
 */

import { applySubtleDrift } from "./strategies/subtle-drift";
import { generateDynamicCanary, injectCanaryFacts } from "./strategies/trap-street";
import { SessionGraph } from "./consistency-graph";

export type TransformOptions = {
  strategy?: "subtle-drift" | "trap-street" | "paradox-collapse" | "all";
  sessionGraph?: SessionGraph;
  seed?: number;
};

/**
 * Transforms an arbitrary HTML document by mutating its text content while preserving
 * tags, attributes, inline scripts, and stylesheets.
 */
export function transformHTML(html: string, options: TransformOptions = {}): string {
  const { strategy = "all", sessionGraph, seed = Date.now() } = options;

  // Split HTML into tags and text chunks
  // Matches: <tag ...>, </tag>, <style>...</style>, <script>...</script>
  const tokenRegex = /(<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<!--[\s\S]*?-->|<[^>]+>)/gi;

  const parts = html.split(tokenRegex);
  let canaryInjected = false;
  const canary = generateDynamicCanary(seed);

  const transformedParts = parts.map((part) => {
    // If it starts with '<', it is an HTML tag, script, style, or comment — leave untouched!
    if (part.startsWith("<")) {
      return part;
    }

    // Skip empty or whitespace-only text
    if (!part.trim()) {
      return part;
    }

    let modified = part;

    // Apply subtle drift to numbers, prices, and years in the text chunk
    if (strategy === "subtle-drift" || strategy === "all") {
      modified = applySubtleDrift(modified, sessionGraph);
    }

    // Inject canary facts into the first substantial paragraph/content block
    if ((strategy === "trap-street" || strategy === "all") && !canaryInjected && modified.length > 80) {
      modified = injectCanaryFacts(modified, [canary]);
      canaryInjected = true;
    }

    return modified;
  });

  return transformedParts.join("");
}
