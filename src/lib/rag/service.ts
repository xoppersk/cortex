/**
 * RAG ask pipeline — shared by POST /api/rag/ask and the eval harness.
 *
 * Steps: embed query → hybrid dense+sparse retrieval (RRF fusion, k=60) →
 * rerank top-8 → top-4 → threshold gate → assemble ~4k-token cited context.
 * Every ask returns the evidence needed to log a retrieval_events row.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { isDemoMode } from "@/lib/demo";
import { getDB } from "@/lib/demo/store";
import { getEmbeddingsProvider, cosineSimilarity } from "@/lib/llm/embeddings";
import { getReranker, type RerankCandidate } from "@/lib/llm/reranker";
import { demoRetrieve, ensureDemoKBSeeded } from "@/lib/demo/rag";
import { redactPii } from "@/lib/rag/pii";
import {
  fuseCandidates,
  assembleContext,
  NO_CONTEXT_REFUSAL,
  type ScoredChunk,
  type ContextChunk,
} from "@/lib/rag/retrieval";
import { estimateTokens } from "@/lib/tokens";

export interface RagAskOptions {
  kbId: string;
  teamId: string;
  question: string;
  topK?: number;
  rerankTopN?: number;
  similarityThreshold?: number;
}

export interface RagAskResult {
  refused: boolean;
  refusalReason: string | null;
  chunks: ContextChunk[];
  contextBlock: string;
  retrievalLatencyMs: number;
  embeddingTokens: number;
  piiSpansRedacted: number;
  retrievedChunkIds: string[];
  scores: Record<string, { dense: number; sparse: number; fused: number; rerank: number }>;
  droppedFromContext: number;
}

interface KbSettings {
  retrievalTopK: number;
  rerankTopN: number;
  similarityThreshold: number;
}

async function loadKbSettings(kbId: string, teamId: string): Promise<KbSettings | null> {
  if (isDemoMode()) {
    const kb = getDB().kbs.find((k) => k.id === kbId && k.teamId === teamId);
    if (!kb) return null;
    return {
      retrievalTopK: kb.retrievalTopK,
      rerankTopN: kb.rerankTopN,
      similarityThreshold: kb.similarityThreshold,
    };
  }
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("knowledge_bases")
    .select("retrieval_top_k,rerank_top_n,similarity_threshold")
    .eq("id", kbId)
    .eq("team_id", teamId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error || !data) return null;
  return {
    retrievalTopK: data.retrieval_top_k,
    rerankTopN: data.rerank_top_n,
    similarityThreshold: Number(data.similarity_threshold),
  };
}

async function retrieveProduction(
  kbId: string,
  queryVector: number[],
  queryText: string,
  topK: number,
): Promise<{ chunks: Map<string, ScoredChunk>; denseRanked: string[]; sparseRanked: string[] }> {
  const admin = createAdminClient();
  const vectorLiteral = `[${queryVector.join(",")}]`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: denseRows, error: denseErr } = await (admin.rpc as any)("rag_dense_search", {
    p_kb_id: kbId,
    p_query_vector: vectorLiteral,
    p_top_k: topK,
  });
  if (denseErr) throw new Error(`dense retrieval failed: ${denseErr.message}`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sparseRows, error: sparseErr } = await (admin.rpc as any)("rag_sparse_search", {
    p_kb_id: kbId,
    p_query_text: queryText,
    p_top_k: topK,
  });
  if (sparseErr) throw new Error(`sparse retrieval failed: ${sparseErr.message}`);

  const chunks = new Map<string, ScoredChunk>();
  const denseRanked: string[] = [];
  for (const r of denseRows ?? []) {
    denseRanked.push(r.chunk_id);
    chunks.set(r.chunk_id, {
      chunkId: r.chunk_id,
      documentId: r.document_id,
      documentName: r.document_name,
      content: r.content,
      sectionHeading: r.section_heading ?? "",
      denseScore: Number(r.dense_score),
      sparseScore: 0,
    });
  }
  const sparseRanked: string[] = [];
  for (const r of sparseRows ?? []) {
    sparseRanked.push(r.chunk_id);
    const existing = chunks.get(r.chunk_id);
    if (existing) {
      existing.sparseScore = Number(r.sparse_score);
    } else {
      chunks.set(r.chunk_id, {
        chunkId: r.chunk_id,
        documentId: r.document_id,
        documentName: r.document_name,
        content: r.content,
        sectionHeading: r.section_heading ?? "",
        denseScore: 0,
        sparseScore: Number(r.sparse_score),
      });
    }
  }
  return { chunks, denseRanked, sparseRanked };
}

export async function askKnowledgeBase(opts: RagAskOptions): Promise<RagAskResult> {
  const started = Date.now();
  const settings = await loadKbSettings(opts.kbId, opts.teamId);
  if (!settings) throw new Error("Knowledge base not found");

  const topK = opts.topK ?? settings.retrievalTopK;
  const rerankTopN = opts.rerankTopN ?? settings.rerankTopN;
  const threshold = opts.similarityThreshold ?? settings.similarityThreshold;

  // PII redaction BEFORE the query is embedded or sent to any LLM.
  const redacted = redactPii(opts.question);

  const embedder = getEmbeddingsProvider();
  const queryVector = await embedder.embedQuery(redacted.text);
  const embeddingTokens = estimateTokens(redacted.text);

  let chunks: Map<string, ScoredChunk>;
  let denseRanked: string[];
  let sparseRanked: string[];

  if (isDemoMode()) {
    await ensureDemoKBSeeded();
    const { denseRanked: d, sparseRanked: s } = await demoRetrieve(
      opts.kbId, queryVector, redacted.text, topK,
    );
    chunks = new Map();
    denseRanked = [];
    for (const c of d) {
      denseRanked.push(c.id);
      chunks.set(c.id, {
        chunkId: c.id, documentId: c.documentId, documentName: c.documentName,
        content: c.content, sectionHeading: c.sectionHeading,
        denseScore: cosineSimilarity(queryVector, c.vector), sparseScore: 0,
      });
    }
    sparseRanked = [];
    for (const c of s) {
      sparseRanked.push(c.id);
      const existing = chunks.get(c.id);
      if (existing) existing.sparseScore = 1;
      else {
        chunks.set(c.id, {
          chunkId: c.id, documentId: c.documentId, documentName: c.documentName,
          content: c.content, sectionHeading: c.sectionHeading,
          denseScore: 0, sparseScore: 1,
        });
      }
    }
  } else {
    ({ chunks, denseRanked, sparseRanked } = await retrieveProduction(
      opts.kbId, queryVector, redacted.text, topK,
    ));
  }

  if (chunks.size === 0) {
    return emptyResult(Date.now() - started, embeddingTokens, redacted.total, "no_candidates");
  }

  // RRF fusion → top-8 → rerank → top-N.
  // In mock mode the dense leg is a weaker stand-in, so lean on sparse.
  const mockMode = isDemoMode() || embedder.model.startsWith("mock-");
  const fused = fuseCandidates(chunks, denseRanked, sparseRanked, 60, mockMode ? { dense: 0.5, sparse: 2 } : {}).slice(0, topK);
  const reranker = getReranker();
  const candidates: RerankCandidate[] = fused.map((c) => ({
    chunkId: c.chunkId,
    content: c.content,
    denseScore: c.denseScore,
    sparseScore: c.sparseScore,
    fusedScore: c.fusedScore,
  }));
  const reranked = await reranker.rerank(redacted.text, candidates, rerankTopN);

  const topScore = Math.max(0, ...reranked.map((c) => c.denseScore));
  if (topScore < threshold) {
    return emptyResult(Date.now() - started, embeddingTokens, redacted.total, "below_threshold");
  }

  const withScores = reranked.map((r) => {
    const full = chunks.get(r.chunkId)!;
    return { ...full, rerankScore: (r as { rerankScore?: number }).rerankScore ?? r.fusedScore };
  });
  const { chunks: contextChunks, dropped, promptBlock } = assembleContext(withScores);

  const scores: RagAskResult["scores"] = {};
  for (const c of withScores) {
    scores[c.chunkId] = {
      dense: c.denseScore, sparse: c.sparseScore,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fused: (c as any).fusedScore, rerank: c.rerankScore,
    };
  }

  return {
    refused: false,
    refusalReason: null,
    chunks: contextChunks,
    contextBlock: promptBlock,
    retrievalLatencyMs: Date.now() - started,
    embeddingTokens,
    piiSpansRedacted: redacted.total,
    retrievedChunkIds: fused.map((c) => c.chunkId),
    scores,
    droppedFromContext: dropped,
  };
}

function emptyResult(
  latencyMs: number, embeddingTokens: number, piiSpans: number, reason: string,
): RagAskResult {
  return {
    refused: true,
    refusalReason: reason,
    chunks: [],
    contextBlock: NO_CONTEXT_REFUSAL,
    retrievalLatencyMs: latencyMs,
    embeddingTokens,
    piiSpansRedacted: piiSpans,
    retrievedChunkIds: [],
    scores: {},
    droppedFromContext: 0,
  };
}

/** Append-only retrieval_events logging (production; demo skips). */
export async function logRetrievalEvent(input: {
  teamId: string;
  kbId: string;
  conversationId?: string | null;
  messageId?: string | null;
  queryText: string;
  topK: number;
  rerankTopN: number;
  result: RagAskResult;
}): Promise<void> {
  if (isDemoMode()) return;
  const admin = createAdminClient();
  await admin.from("retrieval_events").insert({
    team_id: input.teamId,
    kb_id: input.kbId,
    conversation_id: input.conversationId ?? null,
    message_id: input.messageId ?? null,
    query_text: input.queryText,
    top_k: input.topK,
    rerank_top_n: input.rerankTopN,
    retrieved_chunk_ids: input.result.retrievedChunkIds,
    cited_chunk_ids: input.result.chunks.map((c) => c.chunkId),
    scores: input.result.scores as never,
    refused_no_context: input.result.refused,
    retrieval_latency_ms: input.result.retrievalLatencyMs,
    embedding_tokens: input.result.embeddingTokens,
    pii_spans_redacted: input.result.piiSpansRedacted,
  });
}
