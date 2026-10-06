/**
 * Prompt-template variable machinery: {{variable}} parsing and substitution.
 *
 * Security note (per TECHNICAL-REQUIREMENTS §5): substituted values are
 * escaped before interpolation and never interpreted as instructions —
 * substitution is a pure string replacement, and the resulting prompt is
 * passed as *user* content, never merged into the system prompt.
 */

export interface TemplateVariable {
  name: string;
  label: string;
  defaultValue: string;
  required: boolean;
}

const VARIABLE_RE = /\{\{\s*([A-Za-z_][A-Za-z0-9_]*)\s*\}\}/g;

/** Extract unique variable names from a prompt body, in order of appearance. */
export function extractVariables(promptBody: string): string[] {
  const names: string[] = [];
  const seen = new Set<string>();
  for (const match of promptBody.matchAll(VARIABLE_RE)) {
    const name = match[1]!;
    if (!seen.has(name)) {
      seen.add(name);
      names.push(name);
    }
  }
  return names;
}

/** Escape a substituted value so it can't break out of its slot. */
export function escapeVariableValue(value: string): string {
  // Values are interpolated into user-role content. Neutralize anything that
  // looks like a template placeholder to prevent nested-variable injection.
  return value.replace(/\{\{/g, "&#123;&#123;").replace(/\}\}/g, "&#125;&#125;");
}

export interface SubstitutionResult {
  text: string;
  /** Names of required variables that had no value and no default. */
  missing: string[];
}

/**
 * Substitute variables into a prompt body.
 * Precedence: provided value → variable default → empty string (flagged if required).
 */
export function substituteVariables(
  promptBody: string,
  variables: TemplateVariable[],
  values: Record<string, string>,
): SubstitutionResult {
  const missing: string[] = [];
  const byName = new Map(variables.map((v) => [v.name, v]));

  const text = promptBody.replace(VARIABLE_RE, (_match, rawName: string) => {
    const name = rawName.trim();
    const def = byName.get(name);
    const provided = values[name];
    const value =
      provided !== undefined && provided !== ""
        ? provided
        : (def?.defaultValue ?? "");

    if (def?.required && value === "") {
      if (!missing.includes(name)) missing.push(name);
    }
    return escapeVariableValue(value);
  });

  return { text, missing };
}

/**
 * Validate a template's variable definitions against its body:
 * every {{name}} in the body should have a definition and vice versa.
 */
export function validateTemplateVariables(
  promptBody: string,
  variables: TemplateVariable[],
): string[] {
  const errors: string[] = [];
  const inBody = new Set(extractVariables(promptBody));
  const defined = new Set(variables.map((v) => v.name));

  for (const name of inBody) {
    if (!defined.has(name)) errors.push(`Variable "{{${name}}}" is used but not defined.`);
  }
  for (const v of variables) {
    if (!inBody.has(v.name)) errors.push(`Variable "${v.name}" is defined but not used.`);
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(v.name)) {
      errors.push(`Variable name "${v.name}" is invalid (letters, digits, underscore only).`);
    }
  }
  return errors;
}

/** Split a prompt body into text/variable segments for the highlighted editor. */
export type PromptSegment =
  | { kind: "text"; text: string }
  | { kind: "variable"; name: string };

export function segmentPromptBody(promptBody: string): PromptSegment[] {
  const segments: PromptSegment[] = [];
  let last = 0;
  for (const match of promptBody.matchAll(VARIABLE_RE)) {
    const idx = match.index ?? 0;
    if (idx > last) segments.push({ kind: "text", text: promptBody.slice(last, idx) });
    segments.push({ kind: "variable", name: match[1]! });
    last = idx + match[0].length;
  }
  if (last < promptBody.length) {
    segments.push({ kind: "text", text: promptBody.slice(last) });
  }
  return segments;
}
