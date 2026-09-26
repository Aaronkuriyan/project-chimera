/**
 * lib/provenance/canary-registry.ts
 *
 * Cryptographic Canary Ledger.
 * Provides verifiable mathematical proof that a specific synthetic fact was generated
 * and served to an identified crawler at a precise timestamp.
 *
 * Each ledger entry contains:
 *   - Cryptographic HMAC-SHA256 signature generated with server secret
 *   - Hash-chaining (SHA-256) linking each entry to the preceding entry
 *   - Crawler attribution and injection metadata
 */

import { createHmac, createHash } from "crypto";

export type CanaryLedgerEntry = {
  id: string;
  claim: string;
  searchToken: string;
  targetBot: string;
  clientIp?: string;
  timestamp: number;
  signature: string;
  prevHash: string;
  hash: string;
  status: "ACTIVE" | "DETECTED" | "ARCHIVED";
};

// Default ledger secret (can be overridden via CHIMERA_LEDGER_SECRET env var)
const LEDGER_SECRET = process.env.CHIMERA_LEDGER_SECRET || "chimera-cryptographic-audit-secret-v1";

// In-memory tamper-evident ledger (backed by store/redis in production)
const CANARY_LEDGER: CanaryLedgerEntry[] = [];
let LAST_HASH = "0000000000000000000000000000000000000000000000000000000000000000";

/**
 * Computes an HMAC-SHA256 signature for a canary claim.
 */
export function computeCanarySignature(
  claim: string,
  timestamp: number,
  targetBot: string,
  secret = LEDGER_SECRET
): string {
  const hmac = createHmac("sha256", secret);
  hmac.update(`${claim}|${timestamp}|${targetBot}`);
  return hmac.digest("hex");
}

/**
 * Registers an injected canary into the cryptographic ledger.
 */
export function registerCanary(params: {
  id: string;
  claim: string;
  searchToken: string;
  targetBot: string;
  clientIp?: string;
}): CanaryLedgerEntry {
  const timestamp = Date.now();
  const signature = computeCanarySignature(params.claim, timestamp, params.targetBot);

  // Compute entry hash chaining
  const hash = createHash("sha256")
    .update(`${LAST_HASH}|${params.id}|${signature}|${timestamp}`)
    .digest("hex");

  const entry: CanaryLedgerEntry = {
    id: params.id,
    claim: params.claim,
    searchToken: params.searchToken,
    targetBot: params.targetBot,
    clientIp: params.clientIp,
    timestamp,
    signature,
    prevHash: LAST_HASH,
    hash,
    status: "ACTIVE",
  };

  LAST_HASH = hash;
  CANARY_LEDGER.unshift(entry); // newest first

  // Cap local history to 200 entries
  if (CANARY_LEDGER.length > 200) {
    CANARY_LEDGER.pop();
  }

  return entry;
}

/**
 * Verifies that a canary ledger entry has not been tampered with.
 */
export function verifyCanaryIntegrity(entry: CanaryLedgerEntry): boolean {
  const expectedSig = computeCanarySignature(entry.claim, entry.timestamp, entry.targetBot);
  return expectedSig === entry.signature;
}

/**
 * Retrieves all registered canaries.
 */
export function getCanaryLedger(): CanaryLedgerEntry[] {
  return [...CANARY_LEDGER];
}

/**
 * Scans text against all registered active canaries in the ledger.
 */
export function auditTextAgainstLedger(text: string): CanaryLedgerEntry[] {
  const lower = text.toLowerCase();
  return CANARY_LEDGER.filter((entry) => {
    const tokenMatch = lower.includes(entry.searchToken.toLowerCase());
    const phraseMatch = lower.includes(entry.claim.toLowerCase().slice(0, 32));
    return tokenMatch || phraseMatch;
  });
}
