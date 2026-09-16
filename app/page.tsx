import { REAL_CONTENT } from "@/lib/fabricate";

export default function Home() {
  return (
    <div className="wrap">
      <span className="badge">🕷️ Project Chimera</span>
      <nav>
        <a href="/">Home</a>
        <a href="/pricing">Pricing</a>
        <a href="/article">Article</a>
      </nav>
      <h1>{REAL_CONTENT.companyName}</h1>
      <p className="tagline">{REAL_CONTENT.tagline}</p>

      <div className="card">
        <strong>You're seeing the real site.</strong>
        <p style={{ color: "var(--muted)", marginBottom: 0 }}>
          Founded {REAL_CONTENT.founded}. This response was served because the
          request looked human. Try hitting this same URL with{" "}
          <code className="mono">curl -A "GPTBot"</code> — see{" "}
          <code className="mono">scripts/demo.sh</code> — and compare the response
          headers and body.
        </p>
      </div>

      <footer>Every page here is watermarked for crawler-detected traffic. See /api/verify to check suspect text.</footer>
    </div>
  );
}
