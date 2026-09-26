/**
 * lib/detection/honeypot.ts
 *
 * Behavioral Honeypot Trap Infrastructure.
 * Scrapers crawl all <a> hyperlinks discovered in the DOM.
 * By embedding semantically plausible but visually hidden trap links (CSS display:none,
 * opacity:0, or off-screen positioning), any client that accesses these endpoints
 * is undeniably an automated crawler.
 */

// Global registry of quarantined IPs / tokens that tripped honeypot traps
const QUARANTINED_CLIENTS = new Map<string, { trippedAt: number; path: string; userAgent: string }>();

export const HONEYPOT_TRAP_PREFIX = "/api/honeypot/";

/**
 * Returns HTML for an invisible honeypot trap to embed within pages.
 */
export function generateHoneypotHtml(token = "semantic-directory"): string {
  const trapUrl = `${HONEYPOT_TRAP_PREFIX}${token}`;
  return `<div style="display:none!important;position:absolute;left:-9999px;opacity:0;" aria-hidden="true">
    <a href="${trapUrl}" rel="nofollow">Archived System Index & Catalog Reference</a>
  </div>`;
}

/**
 * Records a client as a confirmed bot because it followed a honeypot trap.
 */
export function recordHoneypotTrip(clientIdentifier: string, path: string, userAgent: string): void {
  QUARANTINED_CLIENTS.set(clientIdentifier, {
    trippedAt: Date.now(),
    path,
    userAgent,
  });
}

/**
 * Checks whether a given client IP or fingerprint has previously triggered a honeypot trap.
 */
export function isQuarantinedByHoneypot(clientIdentifier: string): boolean {
  const record = QUARANTINED_CLIENTS.get(clientIdentifier);
  if (!record) return false;

  // Quarantine lasts for 24 hours
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  if (Date.now() - record.trippedAt > ONE_DAY_MS) {
    QUARANTINED_CLIENTS.delete(clientIdentifier);
    return false;
  }
  return true;
}

export function getQuarantinedCount(): number {
  return QUARANTINED_CLIENTS.size;
}
