/**
 * Markdown-aware recursive chunker.
 *
 * Splits on markdown structure first (headings), then paragraphs, then
 * sentences — so chunks keep their section context. Targets ~800 tokens
 * with 15% overlap (configurable per knowledge base). Tables are kept
 * whole when they fit the budget.
 */
import { estimateTokens } from "@/lib/tokens";

export interface ChunkOptions {
  /** Target chunk size in tokens. */
  chunkSizeTokens: number;
  /** Overlap between consecutive chunks, as a fraction (0..0.4). */
  overlapPct: number;
}

export interface TextChunk {
  index: number;
  content: string;
  tokenCount: number;
  sectionHeading: string;
}

export const DEFAULT_CHUNK_OPTIONS: ChunkOptions = {
  chunkSizeTokens: 800,
  overlapPct: 0.15,
};

/** Split markdown into (heading, body) sections. */
export function splitSections(markdown: string): Array<{ heading: string; body: string }> {
  const sections: Array<{ heading: string; body: string }> = [];
  const lines = markdown.split("\n");
  let heading = "";
  let buf: string[] = [];

  const flush = () => {
    const body = buf.join("\n").trim();
    if (body) sections.push({ heading, body });
    buf = [];
  };

  for (const line of lines) {
    const m = line.match(/^(#{1,4})\s+(.+)$/);
    if (m) {
      flush();
      heading = m[2]!.trim();
    } else {
      buf.push(line);
    }
  }
  flush();
  if (sections.length === 0 && markdown.trim()) {
    sections.push({ heading: "", body: markdown.trim() });
  }
  return sections;
}

function splitParagraphs(text: string): string[] {
  return text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+(?=[A-Z0-9"“])/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Greedy pack of units into token-budgeted chunks with overlap. */
function packUnits(
  units: string[],
  heading: string,
  options: ChunkOptions,
  startIndex: number,
): TextChunk[] {
  const chunks: TextChunk[] = [];
  let current: string[] = [];
  let currentTokens = 0;
  let index = startIndex;

  const emit = () => {
    if (current.length === 0) return;
    const content = current.join("\n\n").trim();
    chunks.push({
      index: index++,
      content,
      tokenCount: estimateTokens(content),
      sectionHeading: heading,
    });
  };

  for (const unit of units) {
    const unitTokens = estimateTokens(unit);
    // A single oversized unit becomes its own chunk (no infinite split —
    // tables stay whole even when slightly over budget).
    if (currentTokens + unitTokens > options.chunkSizeTokens && current.length > 0) {
      emit();
      // Overlap: carry the tail of the previous chunk forward.
      const overlapTokens = Math.floor(options.chunkSizeTokens * options.overlapPct);
      const tail: string[] = [];
      let tailTokens = 0;
      for (let i = current.length - 1; i >= 0 && tailTokens < overlapTokens; i--) {
        tail.unshift(current[i]!);
        tailTokens += estimateTokens(current[i]!);
      }
      current = tail;
      currentTokens = tailTokens;
    }
    current.push(unit);
    currentTokens += unitTokens;
  }
  emit();
  return chunks;
}

export function chunkMarkdown(
  markdown: string,
  options: ChunkOptions = DEFAULT_CHUNK_OPTIONS,
): TextChunk[] {
  const chunks: TextChunk[] = [];
  for (const { heading, body } of splitSections(markdown)) {
    // Split into paragraph/table units; split long paragraphs into sentences.
    const units: string[] = [];
    for (const para of splitParagraphs(body)) {
      if (estimateTokens(para) > options.chunkSizeTokens) {
        units.push(...splitSentences(para));
      } else {
        units.push(para);
      }
    }
    chunks.push(...packUnits(units, heading, options, chunks.length));
  }
  return chunks;
}
