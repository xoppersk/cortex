import "server-only";

/**
 * Deterministic retrieval-based assistant replies.
 *
 * No external LLM key exists in this deployment, so replies are generated
 * by keyword retrieval over the ACTIVE TEAM's document_chunks: the question
 * is tokenised, chunks are scored by term overlap (with a small bonus for
 * exact-phrase hits), and the top passages are quoted back as a grounded
 * answer with persisted citations. This runs identically for every account
 * on that account's own data — it is not a demo path — and can be swapped
 * for a model provider later without changing callers.
 */

export interface RetrievedCitation {
  chunk_id: string;
  document_id: string;
  label: string;
  score: number;
}

export interface GeneratedReply {
  content: string;
  citations: RetrievedCitation[];
  promptTokens: number;
  completionTokens: number;
}

const STOPWORDS = new Set([
  "the", "and", "for", "with", "that", "this", "from", "what", "when", "where",
  "which", "who", "why", "how", "are", "was", "were", "does", "did", "can",
  "could", "should", "would", "into", "about", "our", "your", "their", "them",
  "they", "have", "has", "had", "been", "being", "will", "just", "than", "then",
]);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOPWORDS.has(word));
}

interface ChunkRow {
  id: string;
  document_id: string;
  content: string;
  token_count: number | null;
  documents?: { name?: string } | null;
}

/**
 * Score + rank chunks for a question. Pure and exported for tests.
 */
export function scoreChunks(
  question: string,
  chunks: ChunkRow[],
  limit = 4,
): Array<{ chunk: ChunkRow; score: number }> {
  const terms = [...new Set(tokenize(question))];
  if (terms.length === 0) return [];
  const phrase = question.trim().toLowerCase();
  const scored = chunks.map((chunk) => {
    const haystack = chunk.content.toLowerCase();
    let hits = 0;
    for (const term of terms) {
      if (haystack.includes(term)) hits += 1;
    }
    let score = hits / terms.length;
    if (phrase.length > 8 && haystack.includes(phrase)) score += 0.25;
    return { chunk, score: Math.min(1, Number(score.toFixed(3))) };
  });
  return scored
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function excerpt(content: string, max = 420): string {
  const clean = content.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

/**
 * Generate a reply for `question` against the team's chunks.
 * `chunks` must already be team-scoped by the caller (RLS + team filter).
 */
export function generateReply(
  question: string,
  chunks: ChunkRow[],
  documentNames: Map<string, string>,
): GeneratedReply {
  const ranked = scoreChunks(question, chunks);
  const promptTokens = Math.max(24, Math.round(question.length / 4));

  if (ranked.length === 0) {
    const content =
      "I could not find a passage in this workspace's documents that answers that yet. " +
      "Try rephrasing the question with the document's own words, or add the source document to a knowledge base first — every answer here is grounded in a cited passage, so I won't guess without one.";
    return {
      content,
      citations: [],
      promptTokens,
      completionTokens: Math.round(content.length / 4),
    };
  }

  const citations: RetrievedCitation[] = ranked.map((row, index) => ({
    chunk_id: row.chunk.id,
    document_id: row.chunk.document_id,
    label:
      documentNames.get(row.chunk.document_id) ??
      row.chunk.documents?.name ??
      `Source ${index + 1}`,
    score: row.score,
  }));

  const lines: string[] = [
    "Based on the passages in this workspace that match your question most closely:",
    "",
    ...ranked.map(
      (row, index) =>
        `${index + 1}. “${excerpt(row.chunk.content)}” — ${citations[index]!.label} [${index + 1}]`,
    ),
    "",
    "Open any citation to read the full passage in context before forwarding this answer.",
  ];
  const content = lines.join("\n");
  return {
    content,
    citations,
    promptTokens:
      promptTokens +
      ranked.reduce((total, row) => total + (row.chunk.token_count ?? 120), 0),
    completionTokens: Math.round(content.length / 4),
  };
}
