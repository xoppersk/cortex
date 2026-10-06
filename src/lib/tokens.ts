/**
 * Token math: cost estimation and the local token estimator.
 *
 * Provider-reported usage (from the AI SDK `onFinish`) is authoritative;
 * `estimateTokens` exists only for the pre-flight budget check and the
 * composer's live token estimate. The 4-chars-per-token heuristic is the
 * standard approximation for English prose.
 */

import { getModel } from "./models";

/** Rough token estimate for English text (~4 chars per token). */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

/** USD cost for a (prompt, completion) token pair on a model. */
export function estimateCostUsd(
  modelId: string,
  promptTokens: number,
  completionTokens: number,
): number {
  const model = getModel(modelId);
  const cost =
    (promptTokens / 1000) * model.inputPricePer1k +
    (completionTokens / 1000) * model.outputPricePer1k;
  // 6 decimal places matches usage_events.estimated_cost_usd numeric(10,6).
  return Math.round(cost * 1_000_000) / 1_000_000;
}

/** Human-friendly token count, e.g. 1,204 or 2.3k. */
export function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${(n / 1000).toFixed(1)}k`;
  return n.toLocaleString("en-US");
}

/** Human-friendly USD, e.g. $0.0042. */
export function formatUsd(n: number): string {
  if (n === 0) return "$0.00";
  if (n < 0.01) return `$${n.toFixed(4)}`;
  return `$${n.toFixed(2)}`;
}
