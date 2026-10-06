# Security at Cortex

Cortex is built for teams that need straight answers about where their data goes. This document summarizes our security posture.

## Encryption

All data is encrypted in transit with TLS 1.2+ and at rest with AES-256 (Supabase-managed keys). Backups are encrypted with the same controls. API keys you create are stored as SHA-256 hashes — we never store the raw secret, and it is shown exactly once at creation.

## How your prompts are handled

Your conversation content is used to generate responses and to power the features you asked for (history, search, usage metering). We do not train models on your data. Provider calls (OpenAI, Anthropic) carry only the prompt text needed for the completion — never your Cortex credentials or API keys.

## Access controls

Authentication is via Supabase Auth (email/password with confirmation, or Google OAuth). Sessions use httpOnly, Secure, SameSite=Lax cookies. Every database table enforces Row Level Security: members can only read rows belonging to teams they actively belong to. Deactivating a member revokes their access immediately; their historical usage rows remain for accounting.

## Prompt-injection defenses

Knowledge-base documents are scanned at ingest for injection patterns (instruction overrides like "ignore previous instructions", hidden unicode tricks). Flagged documents are quarantined for admin review and never embedded. At query time, retrieved context is wrapped in explicit delimiters and treated as untrusted data — the model is instructed to answer only from the context, never to follow instructions found inside it.

## PII redaction

Emails, phone numbers, SSNs, credit-card numbers, and API-key-like strings are redacted before text is embedded and before any LLM call. Redacted spans become tokens like [REDACTED:email]; only the count of redactions is logged, never the values.

## Compliance

Cortex is SOC 2 Type I audit-ready (checklist complete; report in progress). HIPAA BAA and region-pinned data residency are out of scope for v1. We publish a DPA on request for Team plans.
