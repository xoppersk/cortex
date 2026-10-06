/**
 * PII redaction — runs BEFORE embedding and BEFORE any LLM call.
 *
 * Patterns: emails, phone numbers, SSNs, credit-card numbers, API-key-like
 * strings. Redacted spans become [REDACTED:<kind>] tokens; only the COUNT
 * of redactions is ever logged (never the values).
 */
export type PiiKind = "email" | "phone" | "ssn" | "credit_card" | "api_key";

interface PiiPattern {
  kind: PiiKind;
  /** Global regex with a single capture group around the sensitive span. */
  regex: RegExp;
}

const PATTERNS: PiiPattern[] = [
  {
    kind: "email",
    regex: /\b([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})\b/g,
  },
  {
    kind: "phone",
    // International-ish: optional +, 7-15 digits with common separators.
    regex: /(\+?\d[\d\s().-]{6,}\d)/g,
  },
  {
    kind: "ssn",
    regex: /\b(\d{3}-\d{2}-\d{4})\b/g,
  },
  {
    kind: "credit_card",
    // 13-19 digits with optional spaces/dashes; Luhn-checked below.
    regex: /\b((?:\d[ -]?){13,19})\b/g,
  },
  {
    kind: "api_key",
    // sk-..., cxk_..., ghp_..., xoxb-..., AKIA..., etc.
    regex: /\b((?:sk|rk|cxk|ghp|gho|xox[bap]|AKIA)[-_A-Za-z0-9]{8,})\b/g,
  },
];

/** Luhn checksum — avoids redacting every long digit string as a card. */
function luhnValid(digits: string): boolean {
  const nums = digits.replace(/\D/g, "");
  if (nums.length < 13 || nums.length > 19) return false;
  let sum = 0;
  let dbl = false;
  for (let i = nums.length - 1; i >= 0; i--) {
    let d = Number(nums[i]);
    if (dbl) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    dbl = !dbl;
  }
  return sum % 10 === 0;
}

/**
 * Phone numbers are the loosest pattern — require a minimum digit count and
 * reject things that look like years, versions, or decimals to limit
 * false positives.
 */
function phoneValid(span: string): boolean {
  const digits = span.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) return false;
  // Reject pure years / short decimals like "2026" or "3.14".
  if (/^\d{4}$/.test(digits)) return false;
  return true;
}

export interface RedactionResult {
  text: string;
  /** Count per kind — safe to log. */
  counts: Partial<Record<PiiKind, number>>;
  total: number;
}

export function redactPii(input: string): RedactionResult {
  let text = input;
  const counts: Partial<Record<PiiKind, number>> = {};

  for (const { kind, regex } of PATTERNS) {
    regex.lastIndex = 0;
    text = text.replace(regex, (match) => {
      if (kind === "credit_card" && !luhnValid(match)) return match;
      if (kind === "phone" && !phoneValid(match)) return match;
      counts[kind] = (counts[kind] ?? 0) + 1;
      return `[REDACTED:${kind}]`;
    });
  }

  const total = Object.values(counts).reduce((s, n) => s + n, 0);
  return { text, counts, total };
}
