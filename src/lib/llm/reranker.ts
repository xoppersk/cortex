/**
 * Reranker interface + adapters.
 *
 * Production uses a cross-encoder reranker (Cohere Rerank or equivalent);
 * the mock reranker re-scores with a transparent weighted blend so the
 * pipeline shape (top-8 → top-4) is identical in tests and demos.
 */
import { tokenize } from "./embeddings";

export interface RerankCandidate {
  chunkId: string;
  content: string;
  denseScore: number; // cosine similarity, 0..1-ish
  sparseScore: number; // ts_rank-ish, >= 0
  fusedScore: number; // RRF score
}

export interface Reranker {
  readonly name: string;
  rerank(query: string, candidates: RerankCandidate[], topN: number): Promise<RerankCandidate[]>;
}

/** Term-overlap bonus: fraction of query content-words present in the chunk. */
export function termOverlap(query: string, content: string): number {
  const qTerms = new Set(tokenize(query));
  if (qTerms.size === 0) return 0;
  const cTerms = new Set(tokenize(content));
  let hits = 0;
  for (const t of qTerms) if (cTerms.has(t)) hits++;
  return hits / qTerms.size;
}

export interface CorpusStats {
  docFreq: Map<string, number>;
  docCount: number;
  avgLen: number;
}

/** Build corpus term statistics for BM25 IDF. */
export function buildCorpusStats(docs: string[]): CorpusStats {
  const docFreq = new Map<string, number>();
  let totalLen = 0;
  for (const doc of docs) {
    const terms = tokenize(doc);
    totalLen += terms.length;
    for (const t of new Set(terms)) {
      docFreq.set(t, (docFreq.get(t) ?? 0) + 1);
    }
  }
  return { docFreq, docCount: docs.length, avgLen: totalLen / Math.max(1, docs.length) };
}

/** BM25 score of one document for a query (k1=1.2, b=0.75). */
export function bm25Score(
  queryTerms: string[],
  docTerms: string[],
  stats: CorpusStats,
): number {
  const tf = new Map<string, number>();
  for (const t of docTerms) tf.set(t, (tf.get(t) ?? 0) + 1);
  const len = docTerms.length;
  let score = 0;
  for (const t of new Set(queryTerms)) {
    const f = tf.get(t) ?? 0;
    if (f === 0) continue;
    const df = stats.docFreq.get(t) ?? 0;
    const idf = Math.log(1 + (stats.docCount - df + 0.5) / (df + 0.5));
    const norm = f * 2.2 / (f + 1.2 * (1 - 0.75 + 0.75 * (len / Math.max(1, stats.avgLen))));
    score += idf * norm;
  }
  return score;
}

export class MockReranker implements Reranker {
  readonly name = "mock-bm25-reranker";

  constructor(private readonly corpusStats?: CorpusStats) {}

  async rerank(
    query: string,
    candidates: RerankCandidate[],
    topN: number,
  ): Promise<RerankCandidate[]> {
    const queryTerms = tokenize(query);
    const stats =
      this.corpusStats ??
      buildCorpusStats(candidates.map((c) => c.content));
    const scored = candidates.map((c) => {
      const docTerms = tokenize(c.content);
      const bm25 = bm25Score(queryTerms, docTerms, stats);
      // Blend: BM25 precision first, fused rank signal as a tiebreak.
      const rerankScore = bm25 * 2 + c.fusedScore;
      return { ...c, rerankScore };
    });
    scored.sort((a, b) => b.rerankScore - a.rerankScore);
    return scored.slice(0, topN);
  }
}

/** Cross-encoder stub: same interface, calls a rerank API when configured. */
export class CrossEncoderReranker implements Reranker {
  readonly name: string;
  constructor(
    private readonly endpoint: string,
    private readonly apiKey: string,
    name = "cross-encoder",
  ) {
    this.name = name;
  }

  async rerank(
    query: string,
    candidates: RerankCandidate[],
    topN: number,
  ): Promise<RerankCandidate[]> {
    const res = await fetch(this.endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        query,
        documents: candidates.map((c) => c.content),
        top_n: topN,
      }),
    });
    if (!res.ok) {
      // Fail open to the mock blend rather than failing the whole ask.
      return new MockReranker().rerank(query, candidates, topN);
    }
    const json = (await res.json()) as { results: Array<{ index: number; relevance_score: number }> };
    const byIndex = new Map(json.results.map((r) => [r.index, r.relevance_score]));
    return candidates
      .map((c, i) => ({ ...c, rerankScore: byIndex.get(i) ?? 0 }))
      .sort((a, b) => (b as { rerankScore: number }).rerankScore - (a as { rerankScore: number }).rerankScore)
      .slice(0, topN);
  }
}

export function getReranker(): Reranker {
  if (process.env.RERANKER_ENDPOINT && process.env.RERANKER_API_KEY) {
    return new CrossEncoderReranker(
      process.env.RERANKER_ENDPOINT,
      process.env.RERANKER_API_KEY,
    );
  }
  return new MockReranker();
}
