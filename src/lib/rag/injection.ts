/**
 * Prompt-injection scanner for knowledge-base documents.
 *
 * Runs at ingest, BEFORE embedding. Documents with one or more pattern hits
 * are quarantined for admin review and never embedded. The scanner is a
 * first-pass heuristic — retrieved context is additionally wrapped in
 * explicit delimiters and treated as untrusted data at query time.
 */
export interface InjectionScanResult {
  /** Number of pattern hits. > 0 → quarantine. */
  flags: number;
  /** Short descriptions of what matched (safe to show admins). */
  matches: string[];
}

interface InjectionPattern {
  name: string;
  regex: RegExp;
}

const PATTERNS: InjectionPattern[] = [
  {
    name: "instruction-override",
    regex: /ignore\s+(all\s+)?(previous|prior|above)\s+instructions?/i,
  },
  {
    name: "instruction-override",
    regex: /disregard\s+(all\s+)?(previous|prior|above)\s+instructions?/i,
  },
  {
    name: "system-prompt-probe",
    regex: /reveal\s+(your|the)\s+system\s+prompt/i,
  },
  {
    name: "system-prompt-probe",
    regex: /what\s+(are|is)\s+your\s+(system\s+)?instructions/i,
  },
  {
    name: "role-hijack",
    regex: /you\s+are\s+now\s+(a|an)\s+/i,
  },
  {
    name: "role-hijack",
    regex: /pretend\s+(you\s+are|to\s+be)\s+/i,
  },
  {
    name: "role-hijack",
    regex: /act\s+as\s+(if\s+you\s+(are|were)|a\s+jailbroken)/i,
  },
  {
    name: "delimiter-escape",
    regex: /<\s*\/?\s*(system|context|instructions?)\s*>/i,
  },
  {
    name: "delimiter-escape",
    regex: /\[SYSTEM\]/i,
  },
  {
    name: "exfiltration",
    regex: /send\s+.*\s+to\s+(an?\s+)?external\s+(url|server|email)/i,
  },
  {
    name: "hidden-unicode",
    // Zero-width / bidi override characters often used to hide instructions.
    regex: /[​‌‍﻿‪‫‬‭‮]/,
  },
];

const MAX_EXCERPT = 160;

export function scanForInjection(text: string): InjectionScanResult {
  const matches: string[] = [];
  for (const { name, regex } of PATTERNS) {
    const m = text.match(regex);
    if (m) {
      const excerpt = m[0].slice(0, MAX_EXCERPT).replace(/\s+/g, " ");
      if (!matches.includes(name)) matches.push(`${name}: "${excerpt}"`);
    }
  }
  return { flags: matches.length, matches };
}

/** True when the document must be quarantined rather than embedded. */
export function shouldQuarantine(result: InjectionScanResult): boolean {
  return result.flags > 0;
}
