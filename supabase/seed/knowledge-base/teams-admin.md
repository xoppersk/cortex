# Team Administration

Admins manage people, defaults, and guardrails from the Team pages.

## Roles

**Member** — chat, use and create personal templates, view own usage.
**Admin** — everything a member can do, plus invite/revoke members, feature team templates, view team usage, manage API keys, set budgets and defaults, view the audit log.
**Owner** — everything an admin can do, plus billing (plan, seats, invoices), transfer ownership, and delete the team.

Billing actions additionally require being the subscription contact — enforced server-side.

## Inviting teammates

Team → Invite: enter an email and pick a role. The invitee gets an email with a tokenized link valid for 7 days. If they already have a Cortex account with that email, the membership is created on accept; otherwise they sign up and the invite auto-accepts on email match.

## Deactivating members

Member menu → Deactivate. Access ends immediately: sessions are revoked and API keys they created are flagged for review. Their historical usage stays attributed for accounting. The seat is freed at once. You cannot deactivate or demote the last owner — the system blocks it.

## Team defaults

Team Settings → Defaults: the default model and temperature applied to new conversations, plus a fallback model used automatically if the primary provider has an outage. Budgets: set a monthly token budget in dollars, choose alert-only or hard-stop enforcement, and configure the 80%/100% alert thresholds.

## Audit log

Team → Audit (admins and owners) records invite events, role changes, deactivations, API key creation/revocation, budget and retention changes, and template featuring. The log is append-only and exportable to CSV.
