# Knowledge Base Guide

Knowledge bases let Cortex answer from your team's own documents — with citations — instead of general model knowledge.

## Creating a knowledge base

Knowledge → New knowledge base. Name it ("Support playbooks") and accept the defaults: ~800-token markdown-aware chunks with 15% overlap, hybrid retrieval over the top 8 candidates, rerank down to 4, and a 0.250 similarity threshold. Team admins can tune all of these later in the KB Settings tab.

## Uploading documents

Documents tab → Upload: PDF, TXT, MD, CSV up to 25 MB each. Each row shows live status: queued → processing → ready. You'll see chunk counts and an embedding cost estimate per document.

## Quarantine

If the prompt-injection scanner flags a document (e.g. it contains "ignore previous instructions"), the document is quarantined: never embedded, held for admin review. Admins see the flagged excerpt and can release or delete it.

## Asking questions

Ask from the KB page or toggle the chat composer to "Knowledge base: <name>". The pipeline: embed your question → hybrid dense+sparse retrieval with reciprocal rank fusion → rerank top-8 to top-4 → assemble a ~4,000-token cited context → stream the answer. Every factual claim carries an inline citation like [1]; click it for the Sources panel with the exact chunk, document, page/section, and similarity score.

## When there's no answer

If nothing scores above the similarity threshold, Cortex says so plainly with a "no relevant information" card and suggests documents to add. It never hallucinates an answer from missing context.

## Measuring quality

The Evals tab shows groundedness (are cited claims supported by cited chunks?), precision@4 (are the retrieved chunks relevant?), answer relevance, and p95 latency — with trends across runs. The CI gate requires groundedness ≥ 90% and precision@4 ≥ 0.80; a failing eval blocks production deploys.
