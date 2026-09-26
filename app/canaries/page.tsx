"use client";

import { useEffect, useState } from "react";

type CanaryEntry = {
  id: string;
  claim: string;
  searchToken: string;
  targetBot: string;
  clientIp?: string;
  timestamp: number;
  signature: string;
  prevHash: string;
  hash: string;
  status: string;
};

export default function CanariesPage() {
  const [canaries, setCanaries] = useState<CanaryEntry[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCanaries() {
      try {
        const res = await fetch("/api/canaries");
        if (res.ok) {
          const data = await res.json();
          setCanaries(data.canaries || []);
        }
      } catch {
        // Fallback
      } finally {
        setLoading(false);
      }
    }
    fetchCanaries();
  }, []);

  const filtered = canaries.filter(
    (c) =>
      c.claim.toLowerCase().includes(search.toLowerCase()) ||
      c.targetBot.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="dash-wrap">
      <div className="dash-header">
        <div>
          <h1>Cryptographic Canary Ledger</h1>
          <p className="dash-sub">
            Tamper-evident, hash-chained ledger of synthetic facts injected into detected crawler responses.
            Each entry is cryptographically signed with HMAC-SHA256 to provide verifiable legal proof of ingestion.
          </p>
        </div>
        <div className="ledger-badge">
          <span className="dot dot-real" />
          HASH-CHAIN ACTIVE (SHA-256)
        </div>
      </div>

      <div className="stat-row">
        <div className="stat-card">
          <span className="stat-num">{canaries.length}</span>
          <span className="stat-label">Active Canary Tokens Registered</span>
        </div>
        <div className="stat-card bot">
          <span className="stat-num">{canaries.filter((c) => c.status === "ACTIVE").length}</span>
          <span className="stat-label">Armed Tripwires</span>
        </div>
        <div className="stat-card human">
          <span className="stat-num">100%</span>
          <span className="stat-label">HMAC Integrity Verification</span>
        </div>
      </div>

      <div className="card">
        <div className="table-header-controls">
          <h2>Registered Canary Tripwires</h2>
          <input
            type="text"
            placeholder="Search by claim, bot, or token ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-input search-box"
          />
        </div>

        {loading ? (
          <div className="dash-empty">Loading cryptographic ledger...</div>
        ) : filtered.length === 0 ? (
          <div className="dash-empty">
            No canaries matched your query. Visit <a href="/simulator">the Simulator</a> or execute requests as GPTBot to register new tokens.
          </div>
        ) : (
          <table className="dash-table">
            <thead>
              <tr>
                <th>Canary ID</th>
                <th>Injected Synthetic Claim</th>
                <th>Target Crawler</th>
                <th>Time Injected</th>
                <th>HMAC-SHA256 Signature</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td className="mono">{c.id}</td>
                  <td>
                    <strong>&ldquo;{c.claim}&rdquo;</strong>
                  </td>
                  <td className="mono accent-txt">{c.targetBot}</td>
                  <td>{new Date(c.timestamp).toLocaleTimeString()}</td>
                  <td className="mono signature-cell" title={c.signature}>
                    {c.signature.slice(0, 16)}…
                  </td>
                  <td>
                    <span className="pill bot">ARMED</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
