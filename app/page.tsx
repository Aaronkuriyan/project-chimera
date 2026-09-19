import { REAL_CONTENT, fabricateDeterministic } from "@/lib/fabricate";

export default function Home() {
  const bizarro = fabricateDeterministic(REAL_CONTENT);

  return (
    <div>
      <header className="topnav">
        <span className="wordmark">chimera</span>
        <nav>
          <a href="/dashboard">Dashboard</a>
          <a href="/verify">Verify</a>
          <a href="https://github.com" target="_blank" rel="noreferrer">
            GitHub
          </a>
        </nav>
      </header>

      <section className="hero">
        <div className="hero-intro">
          <h1>
            This page has two versions.
            <br />
            You&apos;re looking at one of them.
          </h1>
          <p className="hero-sub">
            Chimera fingerprints every visitor. Humans see the real site.
            Detected AI crawlers — GPTBot, ClaudeBot, CCBot, and others — get
            a fabricated one instead, silently, at the same URL.
          </p>
        </div>

        <div className="split">
          <div className="split-pane real">
            <div className="pane-label">
              <span className="dot dot-real" />
              what you see
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
              what GPTBot sees
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
          Not a mockup — try it: <code className="mono">curl -A &quot;GPTBot&quot; yoursite.com/article</code>{" "}
          vs. a normal browser request, and diff the results.
        </p>
      </section>

      <section className="mechanism">
        <h2 className="section-title">How a request gets classified</h2>
        <ol className="steps">
          <li>
            <span className="step-num">1</span>
            <div>
              <h3>Fingerprint</h3>
              <p>
                Every request is scored against known AI-crawler identities and
                header-shape heuristics — missing <code>Accept-Language</code>,
                absent <code>Sec-Fetch-*</code> hints, known scraping-library
                signatures.
              </p>
            </div>
          </li>
          <li>
            <span className="step-num">2</span>
            <div>
              <h3>Fabricate</h3>
              <p>
                Detected bots get served a structurally identical page with
                shifted dates, invented pricing, and substituted entities —
                generated deterministically or via a fast LLM rewrite.
              </p>
            </div>
          </li>
          <li>
            <span className="step-num">3</span>
            <div>
              <h3>Watermark</h3>
              <p>
                The fabricated text carries a hidden zero-width payload plus
                distinctive canary facts, so anything that later reproduces
                them can be traced back to this page.
              </p>
            </div>
          </li>
        </ol>
      </section>

      <section className="cta-row">
        <a href="/dashboard" className="btn-primary">
          Open live dashboard
        </a>
        <a href="/verify" className="btn-ghost">
          Check suspect text
        </a>
        <a href="/pricing" className="btn-ghost">
          See the real pricing page →
        </a>
      </section>

      <footer className="site-footer">
        Every response is stamped with <code>x-chimera-is-bot</code> and{" "}
        <code>x-chimera-confidence</code> headers so you can inspect the
        classification yourself.
      </footer>
    </div>
  );
}
