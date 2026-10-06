# Plan Limits Comparison

The table below summarizes what changes between plans. Limits are enforced automatically; when you hit one, the app explains exactly which limit and links to the upgrade path.

## Feature limits by plan

| Capability | Starter | Pro | Team |
|---|---|---|---|
| Seats included | 3 | 10 (add more) | 25 (add more) |
| Tokens / user / month | 100k | 2M | 5M |
| Knowledge bases | 0 | 1 (500 docs) | Unlimited |
| Prompt template library | Personal only | Team shared | Team shared + featured |
| Usage analytics | Personal only | Team dashboard | Team dashboard + API-key attribution |
| API keys | No | No | Yes |
| Audit log | No | No | Yes, 1-year retention |
| Data retention | 30 days fixed | 90 days fixed | 30/90/365 configurable |
| Support | Community | Email (48h) | Priority (4h) |

## Knowledge base limits

Pro workspaces get one knowledge base with up to 500 documents (25 MB per document). Team workspaces get unlimited knowledge bases and 5,000 documents each. Chunking defaults to ~800 tokens with 15% overlap; Team admins can tune chunk size, retrieval top-k, rerank depth, and the similarity threshold per knowledge base.

## Rate limits

Chat completions: 60 requests/minute per user on Starter, 300/minute on paid plans. Knowledge-base ask: 20 requests/minute on Starter, 120/minute on paid plans, because embedding and reranking are the expensive path.

## Fair use

Automated bulk processing (thousands of near-identical prompts per hour) belongs on API keys with a Team plan. Accounts exhibiting bot-like patterns may be rate-limited to protect shared capacity; the status page and your usage dashboard always show current limits.
