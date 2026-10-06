/**
 * Demo-mode ingest sink + lazy seeding of the demo knowledge base.
 *
 * The demo KB ("Cortex Help Center") is ingested from
 * `supabase/seed/knowledge-base/*.md` on first access, using the REAL
 * ingest pipeline (extract → PII redact → injection scan → chunk → embed
 * with the deterministic mock embeddings). Retrieval then runs against the
 * in-memory chunk store with real cosine similarity.
 */
import { promises as fs } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";

import { ingestDocument, type IngestSink, type DocumentStatus } from "@/lib/rag/ingest";
import { mockEmbedOne } from "@/lib/llm/embeddings";

import { getDB, DEMO_KB_ID, type DemoChunk } from "./store";

class DemoIngestSink implements IngestSink {
  async setDocumentStatus(
    documentId: string,
    status: DocumentStatus,
    detail?: { error?: string; chunkCount?: number; injectionFlags?: number },
  ): Promise<void> {
    const db = getDB();
    const doc = db.documents.find((d) => d.id === documentId);
    if (!doc) return;
    doc.status = status;
    doc.statusError = detail?.error ?? null;
    doc.chunkCount = detail?.chunkCount ?? doc.chunkCount;
    doc.injectionFlags = detail?.injectionFlags ?? doc.injectionFlags;
  }

  async insertChunks(
    kbId: string,
    documentId: string,
    documentName: string,
    chunks: Array<{ content: string; tokenCount: number; sectionHeading: string; vector: number[] }>,
  ): Promise<void> {
    const db = getDB();
    // Replace any previous chunks for this document (idempotent re-ingest).
    db.chunks = db.chunks.filter((c) => c.documentId !== documentId);
    chunks.forEach((c, i) => {
      db.chunks.push({
        id: randomUUID(),
        documentId,
        documentName,
        kbId,
        chunkIndex: i,
        content: c.content,
        tokenCount: c.tokenCount,
        sectionHeading: c.sectionHeading,
        vector: c.vector,
      });
    });
  }
}

let seeding: Promise<void> | null = null;

/** Ingest the seeded markdown docs into the demo KB (once per process). */
export function ensureDemoKBSeeded(): Promise<void> {
  if (!seeding) {
    seeding = (async () => {
      const db = getDB();
      if (db.documents.some((d) => d.kbId === DEMO_KB_ID)) return;

      const dir = join(process.cwd(), "supabase", "seed", "knowledge-base");
      let files: string[];
      try {
        files = (await fs.readdir(dir)).filter((f) => f.endsWith(".md")).sort();
      } catch {
        return; // no seed docs (e.g. minimal checkout) — KB stays empty
      }

      const sink = new DemoIngestSink();
      for (const file of files) {
        const markdown = await fs.readFile(join(dir, file), "utf-8");
        const documentId = randomUUID();
        db.documents.push({
          id: documentId,
          kbId: DEMO_KB_ID,
          name: file,
          status: "queued",
          statusError: null,
          chunkCount: 0,
          injectionFlags: 0,
          createdAt: new Date().toISOString(),
        });
        await ingestDocument(
          {
            kbId: DEMO_KB_ID,
            documentId,
            documentName: file,
            mimeType: "text/markdown",
            bytes: Buffer.from(markdown, "utf-8"),
            chunkOptions: { chunkSizeTokens: 800, overlapPct: 0.15 },
          },
          sink,
        );
      }
    })();
  }
  return seeding;
}

/** Demo hybrid retrieval over the in-memory chunk store. */
export async function demoRetrieve(
  kbId: string,
  queryVector: number[],
  queryText: string,
  topK: number,
): Promise<{
  denseRanked: DemoChunk[];
  sparseRanked: DemoChunk[];
}> {
  await ensureDemoKBSeeded();
  const db = getDB();
  const chunks = db.chunks.filter((c) => c.kbId === kbId);

  // Dense: cosine similarity over mock embeddings.
  const dense = [...chunks]
    .map((c) => ({
      c,
      score: c.vector.reduce((s, v, i) => s + v * (queryVector[i] ?? 0), 0),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((x) => x.c);

  // Sparse: naive term-overlap as the FTS stand-in (section heading included).
  const terms = queryText.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 2);
  const sparse = [...chunks]
    .map((c) => {
      const body = `${c.sectionHeading} ${c.content}`.toLowerCase();
      let hits = 0;
      for (const t of terms) if (body.includes(t)) hits++;
      return { c, score: hits };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((x) => x.c);

  return { denseRanked: dense, sparseRanked: sparse };
}

/** Expose the mock embedder for demo query embedding (same space as chunks). */
export function demoEmbed(text: string): number[] {
  return mockEmbedOne(text);
}

export { DemoIngestSink };
