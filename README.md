# Cortex

**Your team's collective AI brain** — multi-model chat, prompt templates, usage metering, and real RAG over your knowledge base.

Cortex is a production-grade team AI workspace built with Next.js 16, Supabase (PostgreSQL + Row Level Security + pgvector), and the Vercel AI SDK. It demonstrates full-stack SaaS architecture: multi-tenant data isolation, hybrid retrieval with RRF fusion, eval-driven RAG development, and usage-based metering.

## Architecture

```mermaid
graph TB
    subgraph "Client"
        UI[Next.js 16 App Router<br/>React 19 + Tailwind v4]
    end
    
    subgraph "API Layer"
        CHAT[POST /api/chat<br/>Streaming via AI SDK v5]
        RAG[POST /api/rag/ask<br/>Hybrid retrieval]
        TPL[Templates API<br/>CRUD + versions]
        KB[KB API<br/>Upload - ingest]
    end
    
    subgraph "RAG Pipeline"
        ING[Ingest: extract - PII redact<br/>- injection scan - chunk - embed]
        RET[Retrieval: dense + sparse<br/>- RRF fusion - rerank]
        GEN[Grounded generation<br/>with [n] citations]
    end
    
    subgraph "Data"
        PG[(PostgreSQL<br/>Row Level Security)]
        VEC[(pgvector HNSW<br/>Embeddings)]
        FTS[(Full-text search<br/>message_search)]
    end
    
    subgraph "Providers"
        MOCK[Mock provider<br/>deterministic, no keys]
        OAI[OpenAI<br/>via AI SDK]
        ANT[Anthropic<br/>via AI SDK]
    end
    
    UI --> CHAT
    UI --> RAG
    UI --> TPL
    UI --> KB
    CHAT --> MOCK
    CHAT --> OAI
    CHAT --> ANT
    RAG --> RET
    RET --> VEC
    RET --> FTS
    RET --> GEN
    KB --> ING
    ING --> PG
    ING --> VEC
    CHAT --> PG
    TPL --> PG
```

## Stack

**Spelled out for keyword filters:**
- **PostgreSQL** (via Supabase) — primary database, 20 tables
- **Row Level Security** — team-scoped isolation on every table; helper functions `is_team_member()`, `team_role()`
- **JWT auth** via Supabase Auth — email/password + Google OAuth, middleware guards
- **pgvector HNSW** — vector similarity search for embeddings (1536-dim, cosine distance)
- **Stripe webhooks** — seat-based billing, proration, `finalize_message()` usage metering
- **Resend** — transactional email (invites, usage alerts)
- **Vercel AI SDK v5** — streaming chat with `streamText` + `toUIMessageStreamResponse()`
- **Next.js 16** App Router, **TypeScript strict**, **Tailwind CSS v4**, **shadcn/ui**

## Evaluation

**Headline (measured with mocks, pending real keys):**
- **Groundedness: 1.00** (every cited claim supported by retrieved chunks)
- **Precision@4: 0.33** (term-based mock retrieval)

The eval harness (`scripts/eval/`) runs 60 seeded cases against the mock pipeline. The 0.80 precision gate is **provisional pending real embeddings** — term-based mocks cannot bridge vocabulary gaps like "cost" → "$20". See "Lessons Learned" below.

Run it: `pnpm eval` (uses `DEMO_MODE=true`, no keys needed).

## Setup

```bash
git clone https://github.com/xoppersk/cortex.git
cd cortex
pnpm install
cp .env.example .env.local
# Fill in Supabase keys (see "Secrets Needed" below)
pnpm dev                    # http://localhost:3000
pnpm eval                   # RAG eval harness (mocked)
pnpm test                   # Vitest unit tests
```

### Demo mode (no keys)
```bash
DEMO_MODE=true pnpm dev
```
Uses in-memory store with seeded data. Mock LLM generates deterministic responses.

## Secrets Needed

| Secret | Where to get it | Where it goes |
|--------|-----------------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Project Settings | `.env.local` / Vercel env |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → API | `.env.local` / Vercel env |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → API | `.env.local` / Vercel env (server only) |
| `OPENAI_API_KEY` | platform.openai.com | `.env.local` / Vercel env (optional; mock used if absent) |
| `ANTHROPIC_API_KEY` | console.anthropic.com | `.env.local` / Vercel env (optional) |
| `STRIPE_SECRET_KEY` | dashboard.stripe.com (test mode) | `.env.local` / Vercel env (optional; stubs return 501) |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → Webhooks | `.env.local` / Vercel env |
| `RESEND_API_KEY` | resend.com | `.env.local` / Vercel env (optional; logs to console) |

**Never commit these.** See `.env.example` for the shape.

## Lessons Learned

1. **Mocks must mirror architecture, not quality.** The mock embedding is term-based; it implements the hybrid RRF interface faithfully but can't match semantic quality. Document the gap honestly.

2. **Eval-driven RAG development works.** 60 cases written first forced us to confront vocabulary gaps early. The harness caught ranking bugs (missing headings in reranker) that unit tests missed.

3. **RLS is the hard part.** Migrations were straightforward; getting RLS right for team isolation took 3 iterations.

4. **Provider adapter pattern pays off.** Mock default + real adapters behind env checks meant the app worked from day one without keys.

## AI-Workflow Note

Built with AI assistance (Muse). Workflow: specs first (6 design docs) → eval first (60 cases) → vertical slices per phase → mock-driven (no keys needed) → CI gates (typecheck + lint + test + eval + build).

The AI wrote ~85% of the code; Sheku provided direction and made the call to mark the precision gate provisional.

## License

MIT — portfolio project.

