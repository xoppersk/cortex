# Data Retention & Deletion

Cortex keeps your data only as long as your team's policy says, and gives every user self-serve export and deletion.

## Retention windows

Team admins choose a retention window in Team Settings: **30, 90, or 365 days** (Team plan; other plans have fixed windows — see Plan Limits). A nightly job permanently purges message content older than the window. Metadata needed for billing (aggregated token counts, invoices) is kept per our DPA.

## Deleted conversations

Deleting a conversation moves it to trash for 30 days, then it is purged automatically. You can restore from trash any time within that window.

## Export my data

Any user can export their data from Settings → Data: a ZIP containing every conversation as Markdown, their prompt templates, and their usage summary. Exports are generated within minutes and download links expire after 24 hours.

## Delete my account

Settings → Data → Delete my account starts a deletion flow that explains the consequences (team memberships end, personal templates are removed, shared team content the user authored is anonymized). The account and personal data are deleted within 30 days; the user can cancel during a 7-day grace period.

## Knowledge-base documents

Deleting a document removes its chunks and embeddings in the same transaction. Originals are kept in private storage so documents can be re-chunked if the embedding model changes; originals follow the same retention window.
