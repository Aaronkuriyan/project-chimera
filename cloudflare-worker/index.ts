/**
 * cloudflare-worker/index.ts
 *
 * Optional deployment target: Cloudflare Workers instead of Vercel Edge
 * Middleware. Unlike Vercel's middleware, a Cloudflare Worker in front of
 * a zone with Bot Management enabled (Enterprise plan) gets access to
 * `request.cf.botManagement.score` — a real ML-derived score that DOES
 * incorporate TLS/JA3 fingerprinting, not just header heuristics. This is
 * the closest you'll get to the "TLS signature" detection described in
 * the original pitch without hand-rolling your own TLS-terminating proxy.
 *
 * This worker proxies to your origin (e.g. the Next.js app on Vercel) and
 * rewrites the response for bot-scored traffic by calling that deployment's
 * /api/bizarro route.
 *
 * Deploy with: `wrangler deploy` (requires a Cloudflare account + zone with
 * Bot Management; falls back to UA heuristics gracefully if `cf.botManagement`
 * is undefined, e.g. on free/pro plans).
 */

export interface Env {
  ORIGIN: string; // e.g. "https://your-chimera-app.vercel.app"
}

const AI_CRAWLER_UA = /GPTBot|ClaudeBot|CCBot|PerplexityBot|Bytespider|anthropic-ai|Google-Extended/i;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const cf = (request as any).cf as { botManagement?: { score: number } } | undefined;

    const uaFlag = AI_CRAWLER_UA.test(request.headers.get("user-agent") || "");
    // Cloudflare bot scores run 1 (bot) to 99 (human); <30 is a common bot threshold.
    const cfFlag = cf?.botManagement ? cf.botManagement.score < 30 : false;
    const isBot = uaFlag || cfFlag;

    const target = isBot
      ? `${env.ORIGIN}/api/bizarro?page=${encodeURIComponent(url.pathname)}`
      : `${env.ORIGIN}${url.pathname}${url.search}`;

    const originRes = await fetch(target, {
      headers: request.headers,
      method: request.method,
    });

    const res = new Response(originRes.body, originRes);
    res.headers.set("x-chimera-is-bot", String(isBot));
    res.headers.set("x-chimera-source", cf?.botManagement ? "cf-bot-management" : "ua-heuristic");
    return res;
  },
};
