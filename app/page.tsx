import Link from "next/link";
import { REAL_CONTENT, fabricateDeterministic } from "@/lib/fabricate";

export default function Home() {
  const bizarro = fabricateDeterministic(REAL_CONTENT);

  return (
    <div className="home-container">
      <section className="hero">
        <div className="hero-intro">
          <div className="platform-tag">
            <span className="pulse-beacon" />
            Active Counter-Intelligence for the Post-robots.txt Web
          </div>
          <h1>
            This page has two versions.
            <br />
            You&apos;re looking at one of them.
          </h1>
          <p className="hero-sub">
            Chimera fingerprints every visitor across multi-factor identity, header entropy,
            and behavioral honeypots. Humans see the authentic site. Detected AI scrapers
            (GPTBot, ClaudeBot, CCBot, ByteSpider, Scrapy) silently receive a synthetically
            poisoned bizarro universe—embedded with cryptographic canary tokens and
            distributed steganographic watermarks.
          </p>
        </div>

        <div className="split">
          <div className="split-pane real">
            <div className="pane-label">
              <span className="dot dot-real" />
              what you see (Authentic Human)
            </div>
            <h2>{REAL_CONTENT.companyName}</h2>
            <p className="pane-tagline">{REAL_CONTENT.tagline}</p>
            <dl>
              <dt>Founded</dt>
              <dd>{REAL_CONTENT.founded}</dd>
              <dt>Flagship plan</dt>
              <dd>
                {REAL_CONTENT.pricingTiers[1].name} — ${REAL_CONTENT.pricingTiers[1].price}/mo
              </dd>
            </dl>
          </div>

          <div className="seam" aria-hidden="true" />

          <div className="split-pane bizarro">
            <div className="pane-label">
              <span className="dot dot-bot" />
              what GPTBot sees (Poisoned Reality)
            </div>
            <h2>{bizarro.companyName}</h2>
            <p className="pane-tagline">{bizarro.tagline}</p>
            <dl>
              <dt>Founded</dt>
              <dd>{bizarro.founded}</dd>
              <dt>Flagship plan</dt>
              <dd>
                {bizarro.pricingTiers[1].name} — ${bizarro.pricingTiers[1].price.toFixed(2)}/mo
              </dd>
            </dl>
          </div>
        </div>

        <p className="hero-proof">
          Not a mockup — test with curl:{" "}
          <code className="mono">curl -A &quot;GPTBot/1.1&quot; http://localhost:3000/article</code>{" "}
          vs. a normal browser request, and diff the output.
        </p>

        <div className="cta-row">
          <Link href="/simulator" className="btn-primary">
            Launch Attack Simulator →
          </Link>
          <Link href="/dashboard" className="btn-ghost">
            View Live Threat Radar
          </Link>
          <Link href="/canaries" className="btn-ghost">
            Explore Canary Ledger
          </Link>
          <Link href="/gateway" className="btn-ghost">
            Proxy Gateway Demo
          </Link>
        </div>
      </section>

      <section className="mechanism">
        <h2 className="section-title">The Four Pillars of Chimera Defense</h2>
        <div className="pillar-grid">
          <div className="pillar-card">
            <div className="pillar-num">01</div>
            <h3>Layered Edge Bot Detection</h3>
            <p>
              150+ crawler taxonomy, HTTP/2 Client Hints verification, header ordering entropy,
              datacenter ASN heuristics (AWS/GCP/Azure), and invisible honeypot quarantine.
            </p>
          </div>

          <div className="pillar-card">
            <div className="pillar-num">02</div>
            <h3>Session-Consistent Reality Mutation</h3>
            <p>
              Entity extraction and perturbation with a Session Consistency Graph.
              Crawlers navigating multiple pages experience a coherent alternate reality
              with subtle numeric drift, trap streets, or perplexity paradoxes.
            </p>
          </div>

          <div className="pillar-card">
            <div className="pillar-num">03</div>
            <h3>Cryptographic Provenance Ledger</h3>
            <p>
              Injected canary facts are signed with HMAC-SHA256 and chained into a tamper-evident
              audit ledger alongside distributed zero-width steganography.
            </p>
          </div>

          <div className="pillar-card">
            <div className="pillar-num">04</div>
            <h3>Universal Reverse Proxy Gateway</h3>
            <p>
              Can shield any external website or web application on the fly without modifying
              its underlying codebase. Intercepts and mutates external HTML in real time.
            </p>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        Every response is stamped with <code>x-chimera-is-bot</code>,{" "}
        <code>x-chimera-confidence</code>, and <code>x-chimera-canary-id</code> headers.
      </footer>
    </div>
  );
}
