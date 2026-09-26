import { describe, it, expect } from "vitest";
import { runChimeraBenchmarks } from "../run-benchmark";

describe("Chimera Performance & Integrity Benchmarks", () => {
  it("executes the full benchmark suite without performance regression or errors", () => {
    expect(() => runChimeraBenchmarks()).not.toThrow();
  });
});
