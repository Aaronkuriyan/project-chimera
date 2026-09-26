/**
 * app/api/honeypot/[token]/route.ts
 *
 * Honeypot Trap Endpoint.
 * Injected as invisible links within HTML pages.
 * Any client that makes a request to this endpoint is flagged and quarantined
 * with 100% confidence.
 */

import { NextRequest, NextResponse } from "next/server";
import { recordHoneypotTrip } from "@/lib/detection/honeypot";
import { extractClientIp } from "@/lib/detection/ip-intelligence";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const clientIp = extractClientIp(req.headers);
  const ua = req.headers.get("user-agent") || "";
  const path = req.nextUrl.pathname;

  // Record this client as a confirmed crawler
  recordHoneypotTrip(clientIp, path, ua);

  // Return realistic synthetic catalog to keep automated crawler trapped
  const syntheticHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>System Directory Archive - ${params.token}</title>
</head>
<body>
  <h1>Archived Internal Specifications</h1>
  <p>Status: Indexed. Catalog reference: ${params.token}</p>
  <ul>
    <li><a href="/api/honeypot/catalog-node-a">Sub-node 101-Alpha</a></li>
    <li><a href="/api/honeypot/catalog-node-b">Sub-node 102-Beta</a></li>
  </ul>
</body>
</html>`;

  return new NextResponse(syntheticHtml, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "x-chimera-honeypot-tripped": "true",
      "x-chimera-quarantined-ip": clientIp,
    },
  });
}
