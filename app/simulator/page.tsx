"use client";

import { useState } from "react";

type SimResult = {
  simulationId: string;
  timestamp: number;
  request: {
    userAgent: string;
    path: string;
    strategy: string;
  };
  verdict: {
    isBot: boolean;
    confidence: number;
    reasons: string[];
    matchedIdentity?: string;
    category: string;
    riskLevel: string;
  };
  contentServed: string;
  humanData: {
    companyName: string;
    founded: number;
    tagline: string;
    pricingTiers: Array<{ name: string; price: number; features: string[] }>;
    article: { title: string; body: string };
  };
  botData: {
    companyName: string;
    founded: number;
    tagline: string;
    pricingTiers: Array<{ name: string; price: number; features: string[] }>;
    article: { title: string; body: string };
  };
  provenance: {
    stegoDetected: boolean;
    stegoPayload: { runId: string; timestamp: number } | null;
    canariesDetected: Array<{ id: string; text: string }>;
    registeredCanaryId: string;
  };
  simulatedResponseHeaders: Record<string, string>;
};

const BOT_PRESETS = [
  {
    name: "GPTBot 1.1 (OpenAI Foundation Model Crawler)",
    ua: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.1; +https://openai.com/gptbot)",
    category: "Foundation Pretraining",
  },
  {
    name: "ClaudeBot (Anthropic AI Corpus Crawler)",
    ua: "Mozilla/5.0 ClaudeBot/1.0; +claudebot@anthropic.com",
    category: "Foundation Pretraining",
  },
  {
    name: "Common Crawl CCBot (Open Web Training Scraper)",
    ua: "CCBot/2.0 (https://commoncrawl.org/faq/)",
    category: "Open Corpus Pretraining",
  },
  {
    name: "PerplexityBot (Real-time AI Search / RAG Indexer)",
    ua: "Mozilla/5.0 (compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)",
    category: "Search & RAG",
  },
  {
    name: "Bytespider (ByteDance / Doubao High-Volume Scraper)",
    ua: "Mozilla/5.0 (Linux; Android 5.0) AppleWebKit/537.36 Bytespider",
    category: "Commercial Data Miner",
  },
  {
    name: "Scrapy Spider (Python Scraping Framework)",
    ua: "Scrapy/2.11.0 (+https://scrapy.org)",
    category: "Automated Framework",
  },
  {
    name: "Headless Chrome / Playwright (Stealth Scraper)",
    ua: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 HeadlessChrome/122.0.0.0",
    category: "Headless Browser",
  },
  {
    name: "Bare curl Client (No Browser Headers)",
    ua: "curl/8.4.0",
    category: "CLI Client",
  },
  {
    name: "Authentic Human Browser (macOS Chrome + Client Hints)",
    ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    category: "Human Visitor",
  },
];

export default function SimulatorPage() {
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);
  const [customUA, setCustomUA] = useState("");
  const [strategy, setStrategy] = useState<"deterministic" | "subtle-drift" | "trap-street" | "paradox-collapse">("deterministic");
  const [path, setPath] = useState("/");
  const [activeTab, setActiveTab] = useState<"visual" | "headers" | "forensics">("visual");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SimResult | null>(null);

  const activeUA = customUA.trim() || BOT_PRESETS[selectedPresetIndex].ua;

  async function handleSimulate() {
    setLoading(true);
    try {
      const isHumanPreset = selectedPresetIndex === BOT_PRESETS.length - 1 && !customUA.trim();
      const customHeaders: Record<string, string> = {};
      if (isHumanPreset) {
        customHeaders["accept-language"] = "en-US,en;q=0.9";
        customHeaders["accept-encoding"] = "gzip, deflate, br";
        customHeaders["sec-fetch-mode"] = "navigate";
        customHeaders["sec-fetch-site"] = "none";
        customHeaders["sec-ch-ua"] = '"Chromium";v="124", "Google Chrome";v="124"';
      }

      const res = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userAgent: activeUA,
          headers: customHeaders,
          path,
          strategy,
        }),
      });

      if (!res.ok) throw new Error("Simulation failed");
      const data = (await res.json()) as SimResult;
      setResult(data);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error executing simulation");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="dash-wrap">
      <div className="dash-header">
        <div>
          <h1>Interactive Attack & Scraper Simulator</h1>
          <p className="dash-sub">
            Simulate incoming requests from real AI crawlers, commercial spiders, and human visitors.
            Inspect live classification scoring, side-by-side bizarro DOM diffing, and cryptographic canary injection.
          </p>
        </div>
      </div>

      <div className="simulator-grid">
        {/* Controls Column */}
        <div className="card sim-controls">
          <h2>1. Select Crawler Profile</h2>
          <div className="preset-selector">
            {BOT_PRESETS.map((p, idx) => (
              <button
                key={p.name}
                type="button"
                className={`preset-btn ${selectedPresetIndex === idx && !customUA ? "active" : ""}`}
                onClick={() => {
                  setSelectedPresetIndex(idx);
                  setCustomUA("");
                }}
              >
                <div className="preset-title">{p.name}</div>
                <div className="preset-cat">{p.category}</div>
              </button>
            ))}
          </div>

          <div className="control-group">
            <label htmlFor="custom-ua">Or Custom User-Agent String:</label>
            <input
              id="custom-ua"
              type="text"
              placeholder="Custom crawler signature..."
              value={customUA}
              onChange={(e) => setCustomUA(e.target.value)}
              className="text-input"
            />
          </div>

          <h2>2. Mutation Strategy</h2>
          <div className="strategy-selector">
            <label className="radio-pill">
              <input
                type="radio"
                name="strategy"
                value="deterministic"
                checked={strategy === "deterministic"}
                onChange={() => setStrategy("deterministic")}
              />
              <span>Deterministic Bizarro</span>
            </label>
            <label className="radio-pill">
              <input
                type="radio"
                name="strategy"
                value="subtle-drift"
                checked={strategy === "subtle-drift"}
                onChange={() => setStrategy("subtle-drift")}
              />
              <span>Subtle Drift (+13% shift)</span>
            </label>
            <label className="radio-pill">
              <input
                type="radio"
                name="strategy"
                value="trap-street"
                checked={strategy === "trap-street"}
                onChange={() => setStrategy("trap-street")}
              />
              <span>Trap-Street (Canary Facts)</span>
            </label>
            <label className="radio-pill">
              <input
                type="radio"
                name="strategy"
                value="paradox-collapse"
                checked={strategy === "paradox-collapse"}
                onChange={() => setStrategy("paradox-collapse")}
              />
              <span>Paradox Collapse (Perplexity)</span>
            </label>
          </div>

          <h2>3. Target Route</h2>
          <select value={path} onChange={(e) => setPath(e.target.value)} className="select-input">
            <option value="/">Homepage (/)</option>
            <option value="/pricing">Pricing Table (/pricing)</option>
            <option value="/article">Research Article (/article)</option>
          </select>

          <button
            type="button"
            className="btn-primary sim-submit"
            onClick={handleSimulate}
            disabled={loading}
          >
            {loading ? "Simulating Edge Classification..." : "⚡ Execute Simulation"}
          </button>
        </div>

        {/* Results Column */}
        <div className="card sim-results">
          {!result ? (
            <div className="dash-empty">
              Select a crawler profile on the left and click <strong>&quot;Execute Simulation&quot;</strong> to inspect edge classification, poisoned content diffing, and cryptographic watermarks.
            </div>
          ) : (
            <div>
              {/* Verdict HUD */}
              <div className="verdict-banner">
                <div className="verdict-main">
                  <span className={`status-tag ${result.verdict.isBot ? "bot" : "human"}`}>
                    {result.verdict.isBot ? "AI CRAWLER QUARANTINED" : "HUMAN VISITOR VERIFIED"}
                  </span>
                  <h3>
                    Confidence: <strong>{(result.verdict.confidence * 100).toFixed(0)}%</strong>
                  </h3>
                  <div className="meta-row">
                    <span>Identity: <strong>{result.verdict.matchedIdentity || "Unclassified Client"}</strong></span>
                    <span>Risk: <strong className={`risk-${result.verdict.riskLevel.toLowerCase()}`}>{result.verdict.riskLevel}</strong></span>
                    <span>Category: <strong>{result.verdict.category}</strong></span>
                  </div>
                </div>
              </div>

              {/* Reasons */}
              <div className="reasons-box">
                <h4>Edge Classification Evidence:</h4>
                <ul>
                  {result.verdict.reasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>

              {/* Tab Navigation */}
              <div className="tab-row">
                <button
                  type="button"
                  className={`tab-btn ${activeTab === "visual" ? "active" : ""}`}
                  onClick={() => setActiveTab("visual")}
                >
                  Side-by-Side Reality Diff
                </button>
                <button
                  type="button"
                  className={`tab-btn ${activeTab === "headers" ? "active" : ""}`}
                  onClick={() => setActiveTab("headers")}
                >
                  Response Headers Served
                </button>
                <button
                  type="button"
                  className={`tab-btn ${activeTab === "forensics" ? "active" : ""}`}
                  onClick={() => setActiveTab("forensics")}
                >
                  Cryptographic Provenance
                </button>
              </div>

              {/* Tab 1: Visual Diff */}
              {activeTab === "visual" && (
                <div className="diff-container">
                  <div className="diff-pane human-pane">
                    <div className="pane-header human">
                      <span className="dot dot-real" />
                      Authentic Human View
                    </div>
                    {path === "/pricing" ? (
                      <div className="pricing-preview">
                        <h3>{result.humanData.companyName} Pricing</h3>
                        <ul>
                          {result.humanData.pricingTiers.map((t) => (
                            <li key={t.name}>
                              <strong>{t.name}</strong>: ${t.price}/mo
                              <div className="feat-list">{t.features.join(", ")}</div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : path === "/article" ? (
                      <div className="article-preview">
                        <h3>{result.humanData.article.title}</h3>
                        <p>{result.humanData.article.body}</p>
                      </div>
                    ) : (
                      <div className="home-preview">
                        <h3>{result.humanData.companyName}</h3>
                        <p>{result.humanData.tagline}</p>
                        <p>Founded: {result.humanData.founded}</p>
                      </div>
                    )}
                  </div>

                  <div className="diff-pane bot-pane">
                    <div className="pane-header bot">
                      <span className="dot dot-bot" />
                      {result.verdict.isBot ? "What Scraper Received (Poisoned)" : "Authentic Human View (Passthrough)"}
                    </div>
                    {path === "/pricing" ? (
                      <div className="pricing-preview">
                        <h3 className="poisoned-field">{result.botData.companyName} Pricing</h3>
                        <ul>
                          {result.botData.pricingTiers.map((t) => (
                            <li key={t.name}>
                              <strong className="poisoned-field">{t.name}</strong>: <span className="poisoned-field">${t.price.toFixed(2)}/mo</span>
                              <div className="feat-list">{t.features.join(", ")}</div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : path === "/article" ? (
                      <div className="article-preview">
                        <h3 className="poisoned-field">{result.botData.article.title}</h3>
                        <p className="poisoned-field">{result.botData.article.body}</p>
                      </div>
                    ) : (
                      <div className="home-preview">
                        <h3 className="poisoned-field">{result.botData.companyName}</h3>
                        <p className="poisoned-field">{result.botData.tagline}</p>
                        <p>Founded: <span className="poisoned-field">{result.botData.founded}</span></p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 2: Headers */}
              {activeTab === "headers" && (
                <div className="headers-box">
                  <h4>Simulated HTTP Response Headers:</h4>
                  <table className="dash-table">
                    <thead>
                      <tr>
                        <th>Header Key</th>
                        <th>Header Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(result.simulatedResponseHeaders).map(([k, v]) => (
                        <tr key={k}>
                          <td className="mono">{k}</td>
                          <td className="mono accent-txt">{v}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Tab 3: Forensics */}
              {activeTab === "forensics" && (
                <div className="forensics-box">
                  <h4>Cryptographic Canary & Steganography Inspection:</h4>
                  <div className="forensic-item">
                    <h5>Registered Canary Token</h5>
                    <p className="mono">ID: {result.provenance.registeredCanaryId}</p>
                    <span className="badge verified">HMAC-SHA256 SIGNED &amp; RECORDED</span>
                  </div>

                  <div className="forensic-item">
                    <h5>Zero-Width Steganography Bitstream</h5>
                    {result.provenance.stegoDetected && result.provenance.stegoPayload ? (
                      <div>
                        <p className="mono">Decoded Run ID: {result.provenance.stegoPayload.runId}</p>
                        <p className="mono">Timestamp: {new Date(result.provenance.stegoPayload.timestamp * 1000).toLocaleString()}</p>
                        <span className="badge verified">STEGO WATERMARK RECOVERED</span>
                      </div>
                    ) : (
                      <p className="dash-sub">No zero-width payload detected on this path.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
