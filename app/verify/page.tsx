"use client";

import { useState } from "react";

type VerifyResult = {
  stegoWatermarkFound: boolean;
  stegoPayload: { runId: string; timestamp: number } | null;
  canaryFactsMatched: { id: string; text: string }[];
  ledgerMatchesCount: number;
  dossier?: {
    dossierId: string;
    generatedAt: string;
    verdict: string;
    integrityHash: string;
    legalAttestation: string;
    evidence: {
      matchedCanaries: Array<{
        id: string;
        claim: string;
        originalTargetBot: string;
        injectedAt: string;
        cryptographicSignature: string;
        signatureValid: boolean;
      }>;
      steganographyPayload?: {
        runId: string;
        embeddedTimestamp: string;
      };
      suspectTextSnippet: string;
      suspectTextHash: string;
    };
  };
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

  function downloadDossier() {
    if (!result?.dossier) return;
    const blob = new Blob([JSON.stringify(result.dossier, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${result.dossier.dossierId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="dash-wrap">
      <div className="dash-header">
        <div>
          <h1>Forensic Verification &amp; Canary Audit</h1>
          <p className="dash-sub">
            Paste suspect text (an LLM generation, scraped data dump, or aggregator article) to scan
            for Chimera&apos;s two cryptographic provenance markers: distributed zero-width steganography
            and HMAC-signed Canary Facts.
          </p>
        </div>
      </div>

      <div className="card">
        <textarea
          className="verify-textarea"
          placeholder="Paste suspect text or LLM completion output here…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
        />
        <div className="verify-actions">
          <button
            type="button"
            className="btn-primary"
            onClick={handleCheck}
            disabled={loading || !text.trim()}
          >
            {loading ? "Scanning Provenance Signals…" : "🔍 Scan Suspect Text"}
          </button>
          <button
            type="button"
            className="btn-ghost"
            onClick={fetchSampleBizarroText}
            disabled={loading}
          >
            Load Sample Fabricated Page
          </button>
        </div>
      </div>

      {error && <div className="dash-error">{error}</div>}

      {result && (
        <div className="card verify-result">
          <div className="verdict-banner">
            <span
              className={`status-tag ${
                result.stegoWatermarkFound || result.canaryFactsMatched.length
                  ? "bot"
                  : "human"
              }`}
            >
              {result.stegoWatermarkFound || result.canaryFactsMatched.length
                ? "EVIDENCE OF REPUBLISHING / INGESTION DETECTED"
                : "NO PROVENANCE SIGNALS FOUND"}
            </span>
            <p className="verdict-line">{result.verdict}</p>
          </div>

          <div className="verify-grid">
            <div className="verify-detail card">
              <h3>1. Distributed Steganographic Watermark</h3>
              {result.stegoWatermarkFound && result.stegoPayload ? (
                <div>
                  <div className="badge verified">ZW BITSTREAM RECOVERED</div>
                  <ul className="mono-list">
                    <li>Run ID: {result.stegoPayload.runId}</li>
                    <li>
                      Generated:{" "}
                      {new Date(result.stegoPayload.timestamp * 1000).toLocaleString()}
                    </li>
                  </ul>
                  <p className="dash-sub">
                    Proves verbatim or byte-level reproduction of the poisoned payload.
                  </p>
                </div>
              ) : (
                <p className="dash-sub">No zero-width payload detected in this sample.</p>
              )}
            </div>

            <div className="verify-detail card">
              <h3>2. Canary Facts Matched ({result.canaryFactsMatched.length})</h3>
              {result.canaryFactsMatched.length > 0 ? (
                <div>
                  <div className="badge verified">CANARY FACT SURVIVED TOKENIZATION</div>
                  <ul className="canary-list">
                    {result.canaryFactsMatched.map((f) => (
                      <li key={f.id}>
                        <strong>&ldquo;{f.text}&rdquo;</strong>
                      </li>
                    ))}
                  </ul>
                  <p className="dash-sub">
                    Direct circumstantial evidence that the underlying model was exposed to Chimera&apos;s
                    poisoned content during training or RAG retrieval.
                  </p>
                </div>
              ) : (
                <p className="dash-sub">No known canary facts matched.</p>
              )}
            </div>
          </div>

          {result.dossier && (
            <div className="dossier-card card">
              <div className="dossier-header">
                <div>
                  <h3>Official Cryptographic Evidence Dossier</h3>
                  <p className="mono">ID: {result.dossier.dossierId}</p>
                </div>
                <button type="button" className="btn-primary" onClick={downloadDossier}>
                  📥 Download Court-Ready Dossier (JSON)
                </button>
              </div>
              <div className="dossier-body">
                <p className="legal-attestation">
                  &ldquo;{result.dossier.legalAttestation}&rdquo;
                </p>
                <div className="meta-row">
                  <span>
                    Integrity Hash: <strong className="mono">{result.dossier.integrityHash.slice(0, 24)}…</strong>
                  </span>
                  <span>
                    Timestamp: <strong>{new Date(result.dossier.generatedAt).toLocaleString()}</strong>
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
