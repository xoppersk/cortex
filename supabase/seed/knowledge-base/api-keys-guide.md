# API Keys Guide

API keys let your own systems call Cortex chat completions programmatically. Keys are available on the Team plan; only admins and owners can create them.

## Creating a key

API Keys → New key: name it (e.g. "nightly-report-bot"), choose scopes (chat), and set an expiry (30/90/365 days or never). The secret looks like `cxk_9f2a…` and is shown exactly once — copy it immediately. We store only a SHA-256 hash, so a lost key cannot be recovered; create a new one.

## Using a key

Send it as a bearer token:

```
curl -H "Authorization: Bearer cxk_..." \
     -d '{"model":"cortex-flash","messages":[{"role":"user","content":"Summarize Q3"}]}' \
     https://app.cortex.app/api/v1/chat
```

Responses can stream (SSE) or return JSON. Usage is attributed to the key and visible in the Usage dashboard under the API-keys filter.

## Revocation

Revoke from the key table. Revoked keys are rejected within 60 seconds everywhere, and the revocation is written to the audit log. If a key leaks, revoke it first, then investigate — never try to "un-revoke".

## Key hygiene

Give each integration its own key with the narrowest scope and an expiry. Rotate keys at least yearly; the dashboard shows last-used timestamps so stale keys are easy to spot. Never commit keys to git — use your secret manager.
