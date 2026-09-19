"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

type Stats = {
  persistent: boolean;
  totalHits: number;
  botHits: number;
  humanHits: number;
  topIdentities: { identity: string; count: number }[];
  byPath: { path: string; bot: number; human: number }[];
  recent: {
    ts: number;
    path: string;
    isBot: boolean;
    confidence: number;
    matchedIdentity?: string;
  }[];
};

const PIE_COLORS = ["#ff3d6e", "#3fe0d0"];

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/stats", { cache: "no-store" });
        if (!res.ok) throw new Error(`Stats fetch failed: ${res.status}`);
        const data = (await res.json()) as Stats;
        if (!cancelled) {
          setStats(data);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Unknown error");
      }
    }
    load();
    const interval = setInterval(load, 4000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="dash-wrap">
      <div className="dash-header">
        <div>
          <a href="/" className="back-link">
            ← Chimera
          </a>
          <h1>Traffic dashboard</h1>
          <p className="dash-sub">
            Live classification of every request hitting <code>/</code>,{" "}
            <code>/pricing</code>, and <code>/article</code>.
          </p>
        </div>
        {stats && (
          <span className={`store-badge ${stats.persistent ? "persistent" : "memory"}`}>
            {stats.persistent ? "Persisted via Upstash Redis" : "In-memory (local/demo mode)"}
          </span>
        )}
      </div>

      {error && <div className="dash-error">Couldn't load stats: {error}</div>}

      {!stats && !error && <div className="dash-empty">Loading…</div>}

      {stats && (
        <>
          <div className="stat-row">
            <div className="stat-card">
              <span className="stat-num">{stats.totalHits}</span>
              <span className="stat-label">Total requests seen</span>
            </div>
            <div className="stat-card bot">
              <span className="stat-num">{stats.botHits}</span>
              <span className="stat-label">Classified as bot</span>
            </div>
            <div className="stat-card human">
              <span className="stat-num">{stats.humanHits}</span>
              <span className="stat-label">Classified as human</span>
            </div>
          </div>

          {stats.totalHits === 0 ? (
            <div className="dash-empty card">
              No traffic yet. Visit <a href="/">the homepage</a> a few times, or run{" "}
              <code>npm run demo</code> in a terminal, then come back.
            </div>
          ) : (
            <div className="chart-grid">
              <div className="card chart-card">
                <h2>Human vs. bot split</h2>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Bot", value: stats.botHits },
                        { name: "Human", value: stats.humanHits },
                      ]}
                      dataKey="value"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={2}
                    >
                      {PIE_COLORS.map((c, i) => (
                        <Cell key={c} fill={PIE_COLORS[i]} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "#16181f",
                        border: "1px solid #2a2e3a",
                        borderRadius: 8,
                        color: "#e7e9ee",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="card chart-card">
                <h2>Top identified crawlers</h2>
                {stats.topIdentities.length === 0 ? (
                  <p className="dash-sub">No identified crawlers yet.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={stats.topIdentities} layout="vertical" margin={{ left: 24 }}>
                      <XAxis type="number" hide />
                      <YAxis
                        type="category"
                        dataKey="identity"
                        width={120}
                        tick={{ fill: "#9aa3b2", fontSize: 12 }}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "#16181f",
                          border: "1px solid #2a2e3a",
                          borderRadius: 8,
                          color: "#e7e9ee",
                        }}
                      />
                      <Bar dataKey="count" fill="#ff3d6e" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          )}

          <div className="card">
            <h2>Recent requests</h2>
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Path</th>
                  <th>Verdict</th>
                  <th>Confidence</th>
                  <th>Matched identity</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent.map((h, i) => (
                  <tr key={i}>
                    <td>{new Date(h.ts).toLocaleTimeString()}</td>
                    <td className="mono">{h.path}</td>
                    <td>
                      <span className={`pill ${h.isBot ? "bot" : "human"}`}>
                        {h.isBot ? "bot" : "human"}
                      </span>
                    </td>
                    <td className="mono">{h.confidence.toFixed(2)}</td>
                    <td className="mono">{h.matchedIdentity || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
