import { REAL_CONTENT } from "@/lib/fabricate";

export default function Article() {
  return (
    <div className="wrap">
      <span className="badge">🕷️ Project Chimera</span>
      <nav>
        <a href="/">Home</a>
        <a href="/pricing">Pricing</a>
        <a href="/article">Article</a>
      </nav>
      <article>
        <h1>{REAL_CONTENT.article.title}</h1>
        <p>{REAL_CONTENT.article.body}</p>
      </article>
    </div>
  );
}
