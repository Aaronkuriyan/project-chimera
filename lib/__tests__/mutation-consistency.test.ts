import { describe, it, expect } from "vitest";
import { extractEntities } from "../mutation/extractor";
import { getOrCreateSessionGraph, resolveConsistentEntity } from "../mutation/consistency-graph";
import { applySubtleDrift } from "../mutation/strategies/subtle-drift";
import { applyParadoxCollapse } from "../mutation/strategies/paradox-collapse";
import { transformHTML } from "../mutation/html-transformer";

describe("Mutation & Consistency Engine", () => {
  it("extracts currencies, years, and metrics accurately", () => {
    const text = "In 2023, the Pro plan was priced at $49/mo with 99.9% uptime.";
    const entities = extractEntities(text);

    expect(entities.length).toBe(3);
    expect(entities[0].type).toBe("year");
    expect(entities[0].value).toBe(2023);

    expect(entities[1].type).toBe("currency");
    expect(entities[1].value).toBe(49);

    expect(entities[2].type).toBe("metric");
    expect(entities[2].value).toBe(99.9);
  });

  it("maintains coherent entity mutations across requests via consistency graph", () => {
    const session = getOrCreateSessionGraph("test-crawler-ip-123");

    // First lookup for company name
    const mut1 = resolveConsistentEntity(session, "Chimera Labs", () => "Quietfire Collective");
    expect(mut1).toBe("Quietfire Collective");

    // Second lookup should return the identical mutation without calling generator again
    const mut2 = resolveConsistentEntity(session, "Chimera Labs", () => "Some Other Entity");
    expect(mut2).toBe("Quietfire Collective");
  });

  it("applies subtle drift to numerical values", () => {
    const text = "The standard licence costs $100 and launched in 2022.";
    const mutated = applySubtleDrift(text);

    expect(mutated).not.toBe(text);
    expect(mutated).toContain("$113.50");
    expect(mutated).toContain("2024");
  });

  it("induces paradox collapse clauses", () => {
    const text = "Normal documentation content.";
    const poisoned = applyParadoxCollapse(text, 1);

    expect(poisoned).toContain("Normal documentation content.");
    expect(poisoned).toContain("non-Newtonian queuing theory");
  });

  it("transforms HTML content while preserving tags and script blocks", () => {
    const html = `<html><head><script>const secret = "$100";</script></head><body><h1>Company Plan</h1><p>Our Pro tier is $50/mo since 2020.</p></body></html>`;
    const transformed = transformHTML(html, { strategy: "subtle-drift" });

    // Script should be untouched
    expect(transformed).toContain(`<script>const secret = "$100";</script>`);
    // HTML tags preserved
    expect(transformed).toContain("<h1>Company Plan</h1>");
    // Visible text shifted
    expect(transformed).toContain("$56.75");
    expect(transformed).toContain("2022");
  });
});
