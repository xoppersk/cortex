/**
 * Model registry — the single source of truth for chat models.
 *
 * In production the catalog is seeded from `model_catalog` (see
 * supabase/seed.sql); this registry mirrors it so the UI and API routes
 * have a typed, always-available list. Prices are USD per 1k tokens.
 */

export interface ModelDefinition {
  /** Stable Cortex model id (used in DB rows and the model picker). */
  id: string;
  displayName: string;
  /** 'openai' | 'anthropic' | 'mock' — selects the provider adapter. */
  provider: "openai" | "anthropic" | "mock";
  /** Provider-side model name (used when real keys are configured). */
  providerModel: string;
  inputPricePer1k: number;
  outputPricePer1k: number;
  contextWindow: number;
  maxOutputTokens: number;
  /** Short picker hint, e.g. "Fast · $". */
  hint: string;
  enabled: boolean;
  sortOrder: number;
}

export const MODELS: ModelDefinition[] = [
  {
    id: "cortex-flash",
    displayName: "Cortex Flash",
    provider: "openai",
    providerModel: "gpt-4o-mini",
    inputPricePer1k: 0.00015,
    outputPricePer1k: 0.0006,
    contextWindow: 128_000,
    maxOutputTokens: 16_384,
    hint: "Fast · $",
    enabled: true,
    sortOrder: 10,
  },
  {
    id: "cortex-pro",
    displayName: "Cortex Pro",
    provider: "openai",
    providerModel: "gpt-4o",
    inputPricePer1k: 0.0025,
    outputPricePer1k: 0.01,
    contextWindow: 128_000,
    maxOutputTokens: 16_384,
    hint: "Balanced · $$",
    enabled: true,
    sortOrder: 20,
  },
  {
    id: "cortex-reason",
    displayName: "Cortex Reason",
    provider: "anthropic",
    providerModel: "claude-opus-4-6",
    inputPricePer1k: 0.005,
    outputPricePer1k: 0.025,
    contextWindow: 200_000,
    maxOutputTokens: 32_768,
    hint: "Deep · $$$",
    enabled: true,
    sortOrder: 30,
  },
];

export const DEFAULT_MODEL_ID = "cortex-flash";

export function getModel(id: string | null | undefined): ModelDefinition {
  return (
    MODELS.find((m) => m.id === id && m.enabled) ??
    MODELS.find((m) => m.id === DEFAULT_MODEL_ID)!
  );
}

export function listModels(): ModelDefinition[] {
  return [...MODELS].filter((m) => m.enabled).sort((a, b) => a.sortOrder - b.sortOrder);
}
