/**
 * Mock chat model — a deterministic LanguageModelV2 for keyless operation.
 *
 * Used whenever no provider API key is configured (local dev, demo mode,
 * CI/e2e). Streams word-by-word with small delays so the streaming UI,
 * stop/abort handling, and onFinish persistence are exercised exactly like
 * the real path. Responses are clearly synthetic; the mock never claims
 * otherwise.
 */
import { simulateReadableStream } from "ai";
import { MockLanguageModelV2 } from "ai/test";

import { estimateTokens } from "@/lib/tokens";

export interface MockResponseInput {
  /** The full prompt messages as plain text (user-visible parts). */
  promptText: string;
  /** The last user message, for topical responses. */
  lastUserText: string;
  /** Optional system context (e.g. RAG context block) the mock should use. */
  systemContext?: string;
  /** Structured cited chunks — preferred over systemContext for labeling. */
  citedChunks?: Array<{ label: string; content: string }>;
}

/**
 * Build the mock's answer text. Deliberately structured markdown so message
 * rendering (headings, lists, code blocks) is exercised in tests and demos.
 */
export function buildMockAnswer(input: MockResponseInput): string {
  const topic = input.lastUserText.slice(0, 160).replace(/\s+/g, " ").trim();

  if (input.systemContext) {
    // RAG-flavoured answer: extractive, with [n] citations.
    return buildMockRagAnswer(input);
  }

  return [
    `Here's a draft response to "${topic || "your question"}":`,
    ``,
    `## Key points`,
    ``,
    `- **Start with the outcome.** State the result first, then the reasoning — readers skim.`,
    `- **One idea per paragraph.** Short paragraphs beat walls of text.`,
    `- **End with a next step.** Every message should make the reply obvious.`,
    ``,
    `## Example`,
    ``,
    `When you ask about "${topic || "a topic"}", a good answer is specific,`,
    `checkable, and short enough to act on. (This is a mock response generated`,
    `locally — connect an \`OPENAI_API_KEY\` for real model output.)`,
    ``,
    `\`\`\`text`,
    `subject: quick draft re: ${topic.slice(0, 40) || "your topic"}`,
    `body:    3 bullets, 1 ask, under 120 words.`,
    `\`\`\``,
    ``,
    `Want me to tailor this? Tell me the audience and the tone.`,
  ].join("\n");
}

/** Extractive cited answer used by the RAG path and the eval harness. */
export function buildMockRagAnswer(input: MockResponseInput): string {
  // Prefer structured chunks (correct [n] labels); fall back to flat text.
  const chunks = input.citedChunks;
  if (chunks && chunks.length > 0) {
    const cited = chunks.slice(0, 3).map((c) => {
      const first = splitSentences(c.content)[0] ?? c.content.slice(0, 160);
      return `${first.trim()} ${c.label}`;
    });
    return [
      `Based on the retrieved sources:`,
      ``,
      ...cited.map((c) => `- ${c}`),
      ``,
      `(Mock answer — connect an \`OPENAI_API_KEY\` for real grounded generation.)`,
    ].join("\n");
  }

  const sentences = splitSentences(input.systemContext ?? "").slice(0, 6);
  if (sentences.length === 0) {
    return `I don't have relevant information in the knowledge base to answer that. Try rephrasing with terms from your documents, or ask your admin to add the missing source.`;
  }
  const cited = sentences.slice(0, 3).map((s, i) => `${s.trim()} [${i + 1}]`);
  return [
    `Based on the retrieved sources:`,
    ``,
    ...cited.map((c) => `- ${c}`),
    ``,
    `(Mock answer — connect an \`OPENAI_API_KEY\` for real grounded generation.)`,
  ].join("\n");
}

function splitSentences(text: string): string[] {
  return text
    .replace(/\n+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);
}

export interface MockStreamSpec {
  text: string;
  promptText: string;
  chunkDelayMs?: number;
}

/** A ReadableStream of LanguageModelV2 stream parts for the given text. */
export function mockTextStream({ text, promptText, chunkDelayMs = 14 }: MockStreamSpec) {
  const id = "mock-text-1";
  const words = text.match(/\S+\s*/g) ?? [];
  const usage = {
    inputTokens: estimateTokens(promptText),
    outputTokens: estimateTokens(text),
    totalTokens: estimateTokens(promptText) + estimateTokens(text),
  };
  return simulateReadableStream({
    chunks: [
      { type: "stream-start", warnings: [] },
      { type: "text-start", id },
      ...words.map((delta) => ({ type: "text-delta", id, delta })),
      { type: "text-end", id },
      { type: "finish", finishReason: "stop", usage },
    ],
    chunkDelayInMs: chunkDelayMs,
  });
}

/**
 * Create the mock LanguageModelV2. `respond` maps the prompt to answer text;
 * defaults to the topical markdown generator above.
 */
export function createMockModel(
  respond: (input: MockResponseInput) => string = buildMockAnswer,
): MockLanguageModelV2 {
  return new MockLanguageModelV2({
    provider: "cortex-mock",
    modelId: "cortex-mock",
    /* eslint-disable @typescript-eslint/no-explicit-any */
    doStream: (async (options: any) => {
      const prompt = options.prompt as Array<{
        role: string;
        content: Array<{ type: string; text?: string }>;
      }>;
      const promptText = prompt
        .map((m) => m.content.map((p) => (p.type === "text" ? (p.text ?? "") : "")).join(""))
        .join("\n");
      const lastUser = [...prompt].reverse().find((m) => m.role === "user");
      const lastUserText =
        lastUser?.content.map((p) => (p.type === "text" ? (p.text ?? "") : "")).join("") ?? "";
      const text = respond({ promptText, lastUserText });
      return {
        stream: mockTextStream({ text, promptText }),
      };
    }) as any,
    /* eslint-enable @typescript-eslint/no-explicit-any */
    doGenerate: async (options) => {
      const promptText = JSON.stringify(options.prompt).slice(0, 2000);
      const text = respond({ promptText, lastUserText: promptText });
      return {
        content: [{ type: "text", text }],
        finishReason: "stop",
        usage: {
          inputTokens: estimateTokens(promptText),
          outputTokens: estimateTokens(text),
          totalTokens: estimateTokens(promptText) + estimateTokens(text),
        },
        warnings: [],
      };
    },
  });
}
