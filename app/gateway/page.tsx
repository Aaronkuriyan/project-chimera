"use client";

import { useState } from "react";

export default function GatewayPage() {
  const [targetUrl, setTargetUrl] = useState("https://example.com");
  const [isBotMode, setIsBotMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [responseHeaders, setResponseHeaders] = useState<Record<string, string> | null>(null);
  const [htmlBody, setHtmlBody] = useState<string | null>(null);

  async function handleTestProxy() {
    setLoading(true);
    setResponseHeaders(null);
    setHtmlBody(null);

    const ua = isBotMode
      ? "Mozilla/5.0 (compatible; GPTBot/1.1; +https://openai.com/gptbot)"
      : "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

    try {
      const proxyUrl = `/api/proxy?url=${encodeURIComponent(targetUrl)}`;
      const res = await fetch(proxyUrl, {
        headers: {
          "user-agent": ua,
          accept: "text/html",
        },
      });

      const headersObj: Record<string, string> = {};
      res.headers.forEach((val, key) => {
        headersObj[key] = val;
      });

      const text = await res.text();
      setResponseHeaders(headersObj);
      setHtmlBody(text);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Proxy request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="dash-wrap">
      <div className="dash-header">
        <div>
          <h1>Universal Reverse Proxy Gateway</h1>
          <p className="dash-sub">
            Chimera can operate as a transparent edge shield in front of <em>any</em> upstream website.
            Human traffic passes through unaltered, while AI scrapers automatically receive
            on-the-fly DOM mutation, numerical drift, and injected canary tripwires.
          </p>
        </div>
      </div>

      <div className="card">
        <h2>Configure Gateway Request</h2>
        <div className="proxy-controls">
          <div className="control-group">
            <label htmlFor="target-url">Target Upstream URL:</label>
            <input
              id="target-url"
              type="text"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="https://example.com"
              className="text-input"
            />
          </div>

          <div className="control-group">
            <label>Client Simulation Mode:</label>
            <div className="toggle-group">
              <button
                type="button"
                className={`toggle-btn ${isBotMode ? "active bot" : ""}`}
                onClick={() => setIsBotMode(true)}
              >
                🤖 Simulate AI Crawler (GPTBot / Scraper)
              </button>
              <button
                type="button"
                className={`toggle-btn ${!isBotMode ? "active human" : ""}`}
                onClick={() => setIsBotMode(false)}
              >
                👤 Simulate Human Browser (Chrome Desktop)
              </button>
            </div>
          </div>

          <button
            type="button"
            className="btn-primary"
            onClick={handleTestProxy}
            disabled={loading || !targetUrl.trim()}
          >
            {loading ? "Proxying & Poisoning..." : "🌐 Send via Chimera Gateway"}
          </button>
        </div>
      </div>

      {responseHeaders && (
        <div className="card">
          <h2>Edge Response Headers</h2>
          <div className="headers-grid">
            <div className="stat-card">
              <span className="stat-label">Classification Verdict</span>
              <span className={`stat-num ${responseHeaders["x-chimera-is-bot"] === "true" ? "bot-txt" : "human-txt"}`}>
                {responseHeaders["x-chimera-is-bot"] === "true" ? "POISONED (BOT)" : "AUTHENTIC (HUMAN)"}
              </span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Confidence Score</span>
              <span className="stat-num">{responseHeaders["x-chimera-confidence"] || "N/A"}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Injected Canary ID</span>
              <span className="stat-num mono-sm">{responseHeaders["x-chimera-canary-id"] || "None (Human)"}</span>
            </div>
          </div>
        </div>
      )}

      {htmlBody && (
        <div className="card">
          <h2>Intercepted &amp; Rendered HTML Payload</h2>
          <p className="dash-sub">
            {responseHeaders?.["x-chimera-is-bot"] === "true"
              ? "Notice that all text nodes were dynamically parsed and mutated with subtle drift & canary tokens while the HTML structure was preserved."
              : "Raw upstream content served directly without mutation."}
          </p>
          <pre className="code-block mono">
            {htmlBody.slice(0, 1500)}
            {htmlBody.length > 1500 ? "\n\n... [truncated for display] ..." : ""}
          </pre>
        </div>
      )}
    </div>
  );
}
