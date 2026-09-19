# 🕷️ Project Chimera — Dynamic Reality Poisoning for AI Scrapers

AI crawlers (GPTBot, ClaudeBot, CCBot, PerplexityBot, scraping startups)
harvest content regardless of `robots.txt`. Blocking IPs is a losing game —
UAs rotate, IPs rotate, headless browsers get better every month.

**Chimera doesn't block bots. It feeds them fiction.**

- A human visitor sees your real site.
- A detected AI crawler transparently gets an **AI-fabricated bizarro-universe
  version** — same structure, invented facts (shifted dates, fake pricing,
  fictional entities) — invisibly watermarked.
- Later, if a model's output contains those fabricated facts, you have
  evidence it was trained on (or retrieved) your content.

## How it works

```
Request → Edge Middleware → bot-detection heuristics
                                   │
                     human ───────┼─────── bot
                       │                     │
                 real page               /api/bizarro
              (app/page.tsx etc.)   (fabricated + watermarked)
                       │                     │
                       └────────┬────────────┘
                                ▼
                    logged to /api/log or Upstash
                                │
                                ▼
                    /dashboard ← /api/stats
```

1. **`lib/bot-detection.ts`** — scores every request using User-Agent identity
   matching against known AI-crawler strings, plus header-shape heuristics
   (missing `Accept-Language`, absent `Sec-Fetch-*` hints, known scraping-library
   signatures). 13 unit tests in `lib/__tests__/`.
2. **`middleware.ts`** — routes bot-flagged requests to `/api/bizarro`
   instead of the real page, stamps `x-chimera-*` debug headers on every
   response, and logs the classification for the dashboard.
3. **`lib/fabricate.ts`** — generates the alternate-universe content. Works
   with zero API keys (deterministic date/number/entity transforms) or, if
   `GROQ_API_KEY` is set, asks a fast LLM to rewrite content more naturally.
4. **`lib/watermark.ts`** — embeds provenance two ways (see
   [Watermarking](#watermarking-what-it-actually-proves) below).
5. **`app/verify/`** — a UI (not just an API) for pasting in suspect text and
   checking it against both watermark types.
6. **`app/dashboard/`** — a live analytics view of every classified request:
   bot/human split, top identified crawlers, per-path breakdown, and a
   recent-requests table, backed by `lib/store.ts`.

### Why there's both `/api/log` and `/api/stats`

This tripped me up while building it, so it's worth documenting: Next.js
Edge Middleware always runs in its own sandboxed isolate — even
self-hosted, via the `edge-runtime` package — so a plain in-memory array in
`lib/store.ts` written from `middleware.ts` is **not visible** to a
Node.js-runtime route that imports the same file, because they're different
JS execution contexts entirely. `/api/log` is a Node-runtime relay:
middleware posts hits to it, and it shares real module memory with
`/api/stats` (also Node runtime) within one running server process. If
`UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` are set, this whole
relay is bypassed — middleware and every route write straight to Redis,
which is the correct architecture for a real multi-instance deployment.

## Pages

| Route | What it is |
|---|---|
| `/` | Real landing page — also shows a live split-screen of the real vs. fabricated homepage content, side by side |
| `/pricing`, `/article` | Rest of the real site |
| `/dashboard` | Live traffic analytics — bot/human split, top crawlers, recent request log |
| `/verify` | Paste suspect text, check it against the watermark + canary systems |
| `/api/bizarro` | Fabricated page renderer (only ever hit via middleware rewrite) |
| `/api/verify` | JSON API behind `/verify` |
| `/api/stats` | JSON API behind `/dashboard` |
| `/api/log` | Internal relay — see above |

## Testing

```bash
npm test        # Vitest — bot-detection + watermark unit tests
npx tsc --noEmit # typecheck
npm run build    # full production build
```

CI (`.github/workflows/ci.yml`) runs all three on every push/PR to `main`.

## Quickstart

```bash
git clone <your-repo-url>
cd project-chimera
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — that's the real site.
Visit `/dashboard` and `/verify` too.

### Live demo

```bash
npm run demo
# or: BASE_URL=http://localhost:3000 bash scripts/demo.sh
```

This script sends three requests to `/article`:

1. A real-Chrome-UA request with full browser headers → real content.
2. A `GPTBot`-identified request → fabricated content, `x-chimera-is-bot: true`.
3. A bare `curl` request (default UA, no headers) → also flagged as a bot.

It then diffs the human vs. bot response bodies, and finally POSTs the
fabricated body to `/api/verify` to show the watermark being decoded back out.

You can also just do this by hand for the live judging demo:

```bash
curl -A "GPTBot/1.1" http://localhost:3000/article
curl -A "Mozilla/5.0 ... Chrome/120.0" -H "Accept-Language: en-US" http://localhost:3000/article
```

### Optional: LLM-powered fabrication

```bash
cp .env.example .env.local
# add GROQ_API_KEY=... (free tier at https://console.groq.com)
npm run dev
```

Without a key, Chimera still works — it uses deterministic transforms
(year-shifting, digit-reversal pricing, entity substitution) instead.

### Optional: persistent dashboard data (Upstash Redis)

```bash
# add to .env.local:
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

Free tier at [upstash.com](https://upstash.com). Without it, `/dashboard`
still works locally (in-memory, resets on restart) — see the architecture
note above for why that requires the `/api/log` relay.

## Watermarking: what it actually proves

Being honest about this matters more than it sounds cool, so here's the real
breakdown of the two mechanisms this project uses:

| Mechanism | What it proves | Limitation |
|---|---|---|
| **Zero-width steganography** (`encodeStego`/`decodeStego`) — hidden bits encoded in ZWSP/ZWNJ/ZWJ characters between words | Strong evidence of **verbatim republishing** — e.g. a scraper's cache, an aggregator site, or a search index serving your fabricated page byte-for-byte | Zero-width Unicode is routinely stripped by HTML sanitizers and, critically, by tokenization/data-cleaning pipelines before LLM training. **This is not reliable evidence that a model trained on the text** — treat it as a republishing tripwire, not a training-data proof. |
| **Canary facts** (`CANARY_FACTS` — distinctive fabricated claims like a fake patent number or a specific "founded by retired lighthouse keepers" origin story) | Circumstantial evidence a model was exposed to the page during training or retrieval, if it later reproduces the specific fabricated detail | A single match isn't proof (models occasionally hallucinate coincidentally-similar specifics); treat matches as leads to investigate, not courtroom evidence. This is the same "trap street" / fictitious dictionary entry technique publishers have used for decades. |

Use the `/verify` page, or POST `{"text": "..."}` to `/api/verify` directly,
to scan any suspect text — e.g.
paste in an LLM completion that suspiciously mentions your "Quietfire Tier"
pricing — for both signal types.

## Deployment

### Vercel (primary target)

```bash
npm i -g vercel
vercel
```

Add `GROQ_API_KEY` as an environment variable in the Vercel dashboard if you
want LLM-powered fabrication in production.

**Limitation to know:** Vercel/Next.js Edge Middleware does not expose raw
TLS handshake data, so this deployment path uses User-Agent + header
heuristics only — no true JA3/TLS fingerprinting. In practice this still
catches essentially all major AI crawlers, since they self-identify via
User-Agent by design (it's how they get allowlisted / how sites verify them
against reverse-DNS).

### Cloudflare Workers (upgrade path: real TLS-informed bot scoring)

If you want actual TLS-fingerprint-informed detection, `cloudflare-worker/`
has a proxying Worker that reads `request.cf.botManagement.score`
(Cloudflare's Enterprise Bot Management — an ML score that does incorporate
TLS/JA3 signals) and falls back to the same UA heuristics when that field
isn't available (free/pro plans).

```bash
cd cloudflare-worker
npm i -g wrangler
wrangler deploy
```

Point `ORIGIN` in `wrangler.toml` at your deployed Next.js app.

## Pushing this to GitHub from VS Code

```bash
git init
git add .
git commit -m "Project Chimera: dynamic reality poisoning for AI scrapers"
gh repo create project-chimera --public --source=. --push
```

(No `gh` CLI? Create the empty repo on github.com first, then:)

```bash
git remote add origin https://github.com/<you>/project-chimera.git
git branch -M main
git push -u origin main
```

Or just use VS Code's built-in Source Control panel → "Publish to GitHub".

## Project structure

```
project-chimera/
├── middleware.ts              # bot detection → routing decision
├── lib/
│   ├── bot-detection.ts       # UA + header heuristics
│   ├── fabricate.ts           # bizarro-content generation
│   └── watermark.ts           # stego encode/decode + canary facts
├── app/
│   ├── page.tsx, pricing/, article/   # real site (humans)
│   ├── api/bizarro/route.ts   # fabricated site (bots)
│   └── api/verify/route.ts    # watermark/canary scanner
├── cloudflare-worker/         # optional real-TLS-fingerprint deploy path
└── scripts/demo.sh            # curl-based live demo
```

## Why this matters (and why it's controversial)

This directly engages the content-rights-vs-AI-scraping fight. It's worth
noting in a demo/pitch that:

- Serving different content to bots vs. humans (cloaking) has historically
  drawn scrutiny from search engines when used to manipulate SEO rankings;
  the ethical/legal framing here is different (provenance/anti-scraping,
  not ranking manipulation) but it's fair for judges to ask about it.
- This is a defensive research/demo tool, not a way to poison a *shared*
  public information ecosystem — fabricated pages are served only to
  identified automated traffic, not indexed for human search results.
- Treat the watermarking results as evidence to investigate further, not
  as a standalone legal proof of training-data use.

## License

MIT — do whatever you want with it, just don't claim the canary facts are
real load-bearing physics constants.
