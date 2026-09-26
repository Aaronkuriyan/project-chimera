/**
 * lib/detection/ip-intelligence.ts
 *
 * Cloud & Datacenter ASN / Subnet Intelligence.
 * Over 95% of high-volume AI scraping runs from hyperscaler datacenter instances
 * (AWS EC2, Google Cloud Compute, Azure, Hetzner, DigitalOcean) rather than
 * residential or mobile ISP connections.
 */

export type IPIntelligenceResult = {
  clientIp: string;
  isDatacenterOrProxy: boolean;
  providerGuess?: string;
  scoreAdjustment: number;
  reason?: string;
};

// Known datacenter IP prefixes / subnets (CIDR ranges commonly associated with cloud hosts)
// In production, this integrates with MaxMind GeoIP2 Anonymous IP or IPQualityScore.
// Here we provide a lightweight deterministic subnet & header intelligence engine.
const KNOWN_CLOUD_CIDR_PREFIXES: { prefix: string; name: string }[] = [
  { prefix: "3.", name: "Amazon AWS (US)" },
  { prefix: "18.", name: "Amazon AWS" },
  { prefix: "34.", name: "Google Cloud Platform" },
  { prefix: "35.", name: "Google Cloud Platform" },
  { prefix: "52.", name: "Amazon AWS" },
  { prefix: "54.", name: "Amazon AWS" },
  { prefix: "20.", name: "Microsoft Azure" },
  { prefix: "40.", name: "Microsoft Azure" },
  { prefix: "13.", name: "Microsoft Azure" },
  { prefix: "159.65.", name: "DigitalOcean" },
  { prefix: "167.99.", name: "DigitalOcean" },
  { prefix: "138.68.", name: "DigitalOcean" },
  { prefix: "168.119.", name: "Hetzner Online" },
  { prefix: "195.201.", name: "Hetzner Online" },
  { prefix: "51.15.", name: "Scaleway" },
  { prefix: "140.238.", name: "Oracle Cloud" },
  { prefix: "129.213.", name: "Oracle Cloud" },
];

export function extractClientIp(headers: Headers): string {
  const cfConnectingIp = headers.get("cf-connecting-ip");
  if (cfConnectingIp) return cfConnectingIp.trim();

  const xRealIp = headers.get("x-real-ip");
  if (xRealIp) return xRealIp.trim();

  const xForwardedFor = headers.get("x-forwarded-for");
  if (xForwardedFor) {
    const parts = xForwardedFor.split(",");
    return parts[0].trim();
  }

  return "127.0.0.1";
}

export function evaluateIPIntelligence(headers: Headers): IPIntelligenceResult {
  const clientIp = extractClientIp(headers);

  // Check for proxy-chain indicators
  const viaHeader = headers.get("via");
  const forwardHeader = headers.get("forwarded");
  const hasProxyIndication = Boolean(viaHeader || (forwardHeader && forwardHeader.includes("for=")));

  // Match IP against known cloud provider subnets
  const match = KNOWN_CLOUD_CIDR_PREFIXES.find((c) => clientIp.startsWith(c.prefix));

  if (match) {
    return {
      clientIp,
      isDatacenterOrProxy: true,
      providerGuess: match.name,
      scoreAdjustment: 0.35,
      reason: `Client IP (${clientIp}) originates from known cloud datacenter range: ${match.name}`,
    };
  }

  if (hasProxyIndication) {
    return {
      clientIp,
      isDatacenterOrProxy: true,
      providerGuess: "Proxy / Forwarder",
      scoreAdjustment: 0.2,
      reason: `Request traversed explicit intermediate proxies: ${viaHeader || forwardHeader}`,
    };
  }

  return {
    clientIp,
    isDatacenterOrProxy: false,
    scoreAdjustment: 0.0,
  };
}
