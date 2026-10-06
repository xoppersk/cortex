/**
 * Provider-adapter pattern for chat completions (NEVER invent secrets).
 *
 * `getLanguageModel(modelId)` returns an AI SDK LanguageModelV2:
 *   - real OpenAI / Anthropic adapters when the corresponding API key is set,
 *   - the deterministic mock otherwise (demo mode, local dev, CI/e2e).
 *
 * Keys are read from server env only and never bundled client-side.
 */
import type { LanguageModel } from "ai";

import { getModel } from "@/lib/models";
import { isDemoMode } from "@/lib/demo";

import { createMockModel } from "./mock";

export function hasOpenAIKey(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

export function hasAnthropicKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/** Force the mock even when keys exist (tests, demos). */
export function shouldUseMockLlm(): boolean {
  if (isDemoMode()) return true;
  if (process.env.MOCK_LLM === "true") return true;
  return !hasOpenAIKey() && !hasAnthropicKey();
}

export async function getLanguageModel(modelId: string): Promise<LanguageModel> {
  const def = getModel(modelId);

  if (shouldUseMockLlm()) {
    return createMockModel();
  }

  if (def.provider === "anthropic" && hasAnthropicKey()) {
    const { createAnthropic } = await import("@ai-sdk/anthropic");
    return createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })(
      def.providerModel,
    );
  }

  // Default: OpenAI (covers cortex-flash + cortex-pro).
  const { createOpenAI } = await import("@ai-sdk/openai");
  return createOpenAI({ apiKey: process.env.OPENAI_API_KEY })(def.providerModel);
}

/** Which backend actually served the last getLanguageModel call — for UI badges. */
export function describeLlmBackend(): "mock" | "openai" | "anthropic" {
  if (shouldUseMockLlm()) return "mock";
  return hasAnthropicKey() &&
    getModel(process.env.DEFAULT_MODEL_HINT ?? "cortex-flash").provider === "anthropic"
    ? "anthropic"
    : "openai";
}
