# Troubleshooting

Common issues and their fixes. If you're stuck, the in-app error messages name the cause and the fix — this page collects them in one place.

## "The model timed out — your draft is saved. Retry?"

The provider took longer than 60 seconds. Your prompt is preserved. Click Retry; if it persists, switch to Cortex Flash (faster) or try again in a minute. Status page: status.cortex.app.

## "Rate limited — slow down"

You've hit the per-minute request cap (60/min Starter, 300/min paid for chat; 20/120 for knowledge-base ask). Wait for the countdown shown in the error, or spread automated workloads over API keys on the Team plan.

## "Context too long"

The conversation exceeds the model's context window. Click "Summarize and continue" — Cortex condenses the thread into a summary and keeps going. Long term, start a fresh chat for new topics.

## "Budget hard stop"

Your team hit its monthly token budget with hard-stop enforcement on. Ask an admin to raise the budget in Team Settings, or wait for the monthly reset. Alert-only teams just get notified and keep chatting.

## "No relevant information" (knowledge base)

The retriever found nothing above the similarity threshold. Rephrase with terms from your documents (exact product names, error codes), or ask an admin to add the missing source document. The answer suggests which documents to add.

## Invite link expired

Invite links last 7 days. Ask an admin to resend from Team → Pending invites.

## Streaming stalls mid-response

Click Stop, then Regenerate. If the stream repeatedly drops on long generations, check your network — the stream survives 30s generations on broadband, but aggressive VPNs and proxies sometimes interfere.
