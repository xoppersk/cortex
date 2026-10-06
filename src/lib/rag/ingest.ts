/**
 * Ingest pipeline: upload → extract → PII redact → injection scan →
 * chunk → embed → insert (one transaction per document).
 *
 * The pipeline is storage-agnostic via IngestSink: the production sink
 * writes to Postgres as service_role; the demo sink writes to the
 * in-memory store. Per-document status (queued/processing/ready/failed/
 * quarantined) is reported through the sink so the UI can subscribe.
 */
import { randomUUID } from "crypto";

import { chunkMarkdown, type ChunkOptions } from "./chunking";
import { redactPii } from "./pii";
import { scanForInjection, shouldQuarantine } from "./injection";
import { getEmbeddingsProvider } from "@/lib/llm/embeddings";
import { estimateTokens } from "@/lib/tokens";

export type DocumentStatus = "queued" | "processing" | "ready" | "failed" | "quarantined";

export interface IngestChunk {
  content: string;
  tokenCount: number;
  sectionHeading: string;
  vector: number[];
}

export interface IngestSink {
  setDocumentStatus(
    documentId: string,
    status: DocumentStatus,
    detail?: { error?: string; chunkCount?: number; injectionFlags?: number },
  ): Promise<void>;
  insertChunks(
    kbId: string,
    documentId: string,
    documentName: string,
    chunks: IngestChunk[],
  ): Promise<void>;
}

export interface IngestInput {
  kbId: string;
  documentId: string;
  documentName: string;
  mimeType: string;
  /** Raw file bytes (already read from upload/storage). */
  bytes: Buffer;
  chunkOptions: ChunkOptions;
}

export interface IngestResult {
  documentId: string;
  status: DocumentStatus;
  chunkCount: number;
  piiSpansRedacted: number;
  injectionFlags: number;
  error?: string;
}

const MAX_TEXT_CHARS = 500_000;

/** Extract text from txt/md/csv. PDF extraction needs a parser integration. */
export function extractText(bytes: Buffer, mimeType: string, name: string): string {
  const lower = name.toLowerCase();
  if (
    mimeType.startsWith("text/") ||
    lower.endsWith(".md") ||
    lower.endsWith(".txt") ||
    lower.endsWith(".csv") ||
    lower.endsWith(".markdown")
  ) {
    return bytes.toString("utf-8").slice(0, MAX_TEXT_CHARS);
  }
  if (mimeType === "application/pdf" || lower.endsWith(".pdf")) {
    throw new Error(
      "PDF text extraction is not configured in this environment. " +
        "Convert to Markdown or TXT, or configure the pdfjs-dist extractor (see docs/runbooks).",
    );
  }
  throw new Error(`Unsupported file type: ${mimeType || name}`);
}

export async function ingestDocument(
  input: IngestInput,
  sink: IngestSink,
): Promise<IngestResult> {
  const { kbId, documentId, documentName, mimeType, bytes, chunkOptions } = input;
  await sink.setDocumentStatus(documentId, "processing");

  try {
    // 1. Extract
    const rawText = extractText(bytes, mimeType, documentName);
    if (!rawText.trim()) {
      throw new Error("The document contains no extractable text.");
    }

    // 2. PII redaction (before embedding AND before any LLM call)
    const redacted = redactPii(rawText);

    // 3. Prompt-injection scan → quarantine path
    const scan = scanForInjection(redacted.text);
    if (shouldQuarantine(scan)) {
      await sink.setDocumentStatus(documentId, "quarantined", {
        error: `Quarantined: ${scan.matches.slice(0, 3).join("; ")}`,
        injectionFlags: scan.flags,
      });
      return {
        documentId,
        status: "quarantined",
        chunkCount: 0,
        piiSpansRedacted: redacted.total,
        injectionFlags: scan.flags,
      };
    }

    // 4. Chunk (markdown-aware)
    const chunks = chunkMarkdown(redacted.text, chunkOptions);

    // 5. Embed (batched server-side)
    const provider = getEmbeddingsProvider();
    const vectors = await provider.embed(chunks.map((c) => c.content));

    // 6. Insert in one transaction (the sink owns the transaction boundary)
    await sink.insertChunks(
      kbId,
      documentId,
      documentName,
      chunks.map((c, i) => ({
        content: c.content,
        tokenCount: c.tokenCount,
        sectionHeading: c.sectionHeading,
        vector: vectors[i] ?? [],
      })),
    );

    await sink.setDocumentStatus(documentId, "ready", { chunkCount: chunks.length });
    return {
      documentId,
      status: "ready",
      chunkCount: chunks.length,
      piiSpansRedacted: redacted.total,
      injectionFlags: 0,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ingest failed";
    await sink.setDocumentStatus(documentId, "failed", { error: message });
    return {
      documentId,
      status: "failed",
      chunkCount: 0,
      piiSpansRedacted: 0,
      injectionFlags: 0,
      error: message,
    };
  }
}

/** Convenience: ingest a markdown string (used by demo seeding + tests). */
export async function ingestMarkdown(
  kbId: string,
  documentName: string,
  markdown: string,
  sink: IngestSink,
  chunkOptions?: ChunkOptions,
): Promise<IngestResult> {
  const documentId = randomUUID();
  return ingestDocument(
    {
      kbId,
      documentId,
      documentName,
      mimeType: "text/markdown",
      bytes: Buffer.from(markdown, "utf-8"),
      chunkOptions: chunkOptions ?? { chunkSizeTokens: 800, overlapPct: 0.15 },
    },
    sink,
  );
}

export { estimateTokens };
