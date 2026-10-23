# Usage Dashboard Guide

The Usage page turns token metering into decisions: who uses what, which models drive cost, and whether you're on track against budget.

## Overview tab

KPI cards show month-to-date tokens, estimated cost, active members, and average time-to-first-token. Below: an area chart of tokens per day (zero-baseline, labeled axes), a donut of cost by model, and a ranked list of the most-run prompt templates. The dashboard reflects a sent message within 60 seconds.

## Members tab

A sortable table: avatar, name, conversations, tokens, estimated cost, last active. Click a row for a drawer with that member's recent conversation titles, top models, and a 30-day trend. Admins see the whole team; members see only themselves.

## Budgets

Set a monthly token budget in dollars on the Budgets tab. At 80% and 100% of the budget, admins get an email (sent once per month — idempotent). Choose **alert-only** (keep chatting, just notify) or **hard stop** (block new chats until the budget rises or the month rolls over). The progress bar is the emotional center: green, amber at 80%, red at 100%.

## API keys filter

On the Team plan, filter any view by API key to attribute automation spend separately from human chat. Knowledge-base cost (query embeddings + retrieval) is broken out as its own line so admins see what RAG costs.

## Exporting

"Export CSV" downloads the current view — members, models, or daily totals — for spreadsheets and finance reviews. Cost math is verified against provider invoices within 5%.
