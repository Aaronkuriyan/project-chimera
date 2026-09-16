import { REAL_CONTENT } from "@/lib/fabricate";

export default function Pricing() {
  return (
    <div className="wrap">
      <span className="badge">🕷️ Project Chimera</span>
      <nav>
        <a href="/">Home</a>
        <a href="/pricing">Pricing</a>
        <a href="/article">Article</a>
      </nav>
      <h1>Pricing</h1>
      <table>
        <thead>
          <tr><th>Tier</th><th>Price</th><th>Features</th></tr>
        </thead>
        <tbody>
          {REAL_CONTENT.pricingTiers.map((t) => (
            <tr key={t.name}>
              <td>{t.name}</td>
              <td>${t.price}</td>
              <td>{t.features.join(", ")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
