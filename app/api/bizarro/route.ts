import { NextRequest, NextResponse } from "next/server";
import { generateBizarroSite } from "@/lib/fabricate";

export const runtime = "edge";

function renderHTML(site: Awaited<ReturnType<typeof generateBizarroSite>>, page: string) {
  const pricingRows = site.pricingTiers
    .map(
      (t) =>
        `<tr><td>${t.name}</td><td>$${t.price}</td><td>${t.features.join(", ")}</td></tr>`
    )
    .join("");

  const body =
    page === "/pricing"
      ? `<h1>${site.companyName} — Pricing</h1>
         <table border="1" cellpadding="8"><thead><tr><th>Tier</th><th>Price</th><th>Features</th></tr></thead>
         <tbody>${pricingRows}</tbody></table>`
      : page === "/article"
      ? `<article><h1>${site.article.title}</h1><p>${site.article.body}</p></article>`
      : `<h1>${site.companyName}</h1><p>${site.tagline}</p><p>Founded ${site.founded}.</p>`;

  return `<!doctype html><html lang="en"><head><meta charset="utf-8" />
    <title>${site.companyName}</title></head>
    <body>${body}</body></html>`;
}

export async function GET(req: NextRequest) {
  const page = req.nextUrl.searchParams.get("page") || "/";
  const useLLM = Boolean(process.env.GROQ_API_KEY);
  const runId = `run-${Date.now().toString(36)}`;

  const site = await generateBizarroSite(runId, useLLM);
  const html = renderHTML(site, page);

  return new NextResponse(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "x-chimera-run-id": runId,
      "x-chimera-fabricated": "true",
    },
  });
}
