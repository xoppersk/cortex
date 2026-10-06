# Glossary

**Chunk** — a ~800-token slice of a document produced at ingest; the unit of retrieval and citation.

**Citation** — an inline [n] marker linking an answer claim to the exact chunk it came from.

**Embedding** — a 1536-dimensional vector representing a chunk's meaning, produced by text-embedding-3-small; retrieved by cosine similarity.

**Groundedness** — the share of an answer's cited claims that are actually supported by the cited chunks. Our headline RAG quality metric; the CI gate requires ≥ 90%.

**Hard stop** — budget enforcement mode that blocks new chats when the monthly token budget is exhausted.

**Hybrid retrieval** — combining dense (embedding similarity) and sparse (keyword full-text) search with reciprocal rank fusion, so both semantic matches and exact terms (SKUs, error codes) surface.

**Precision@4** — the share of the top-4 retrieved chunks that are relevant to the question. CI gate: ≥ 0.80.

**Rerank** — a second scoring pass over the top-8 hybrid candidates, keeping the best 4 for the LLM context.

**Seat** — one active team member for billing purposes.

**Template variable** — a {{placeholder}} in a prompt template filled in at use time.

**Token** — roughly ¾ of an English word; the unit of model pricing and budgets.
