"use client";

import { useState } from "react";

type VerifyResult = {
  stegoWatermarkFound: boolean;
  stegoPayload: { runId: string; timestamp: number } | null;
  canaryFactsMatched: { id: string; text: string }[];
  verdict: string;
};

export default function Verify() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheck() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Request failed: ${res.status}`);
      }
      setResult(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function fetchSampleBizarroText() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/article", {
        headers: { "User-Agent": "GPTBot/1.1" },
      });
      const html = await res.text();
      setText(html);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't fetch sample");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="dash-wrap">
      <a href="/" className="back-link">
        ← Chimera
      </a>
      <h1>Verify suspect text</h1>
      <p className="dash-sub">
        Paste any text — an LLM completion, a scraped page, anything — and check it for
        Chimera's two provenance signals: an embedded zero-width watermark, or any of the
        fabricated canary facts.
      </p>

      <div className="card">
        <textarea
          className="verify-textarea"
          placeholder="Paste suspect text here…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
        />
        <div className="verify-actions">
          <button className="btn-primary" onClick={handleCheck} disabled={loading || !text.trim()}>
            {loading ? "Checking…" : "Check text"}
          </button>
          <button className="btn-ghost" onClick={fetchSampleBizarroText} disabled={loading}>
            Load a sample fabricated page
          </button>
        </div>
      </div>

      {error && <div className="dash-error">{error}</div>}

      {result && (
        <div className="card verify-result">
          <p className={`verdict-line ${result.stegoWatermarkFound || result.canaryFactsMatched.length ? "positive" : "negative"}`}>
            {result.verdict}
          </p>

          <div className="verify-detail">
            <h3>Zero-width watermark</h3>
            {result.stegoWatermarkFound && result.stegoPayload ? (
              <ul className="mono-list">
                <li>run ID: {result.stegoPayload.runId}</li>
                <li>generated: {new Date(result.stegoPayload.timestamp * 1000).toLocaleString()}</li>
              </ul>
            ) : (
              <p className="dash-sub">Not found in this text.</p>
            )}
          </div>

          <div className="verify-detail">
            <h3>Canary facts matched ({result.canaryFactsMatched.length})</h3>
            {result.canaryFactsMatched.length > 0 ? (
              <ul>
                {result.canaryFactsMatched.map((f) => (
                  <li key={f.id}>{f.text}</li>
                ))}
              </ul>
            ) : (
              <p className="dash-sub">None matched.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
