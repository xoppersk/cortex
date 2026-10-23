# Message Attachments

Attach files to any message so the model can summarize or analyze your actual documents.

## Supported files

PDF, TXT, MD, and CSV — up to 10 MB per message. Files upload to private storage scoped to your team; only team members can read them.

## How it works

On send, the server extracts text from your attachments (up to 50,000 characters per message) and includes it in the prompt as context. The extracted text is shown as a chip in the composer so you can confirm what the model sees. Scanned PDFs without a text layer extract poorly — export to TXT or MD first for best results.

## Knowledge base vs attachments

Attachments are one-off context for a single conversation. If a document should be answerable repeatedly with citations, upload it to a knowledge base instead: it gets chunked, embedded, and retrieved with hybrid search.

## Limits and safety

Files are checked by extension and MIME type; executables are rejected. Attachment storage follows your team's retention window and is purged by the same nightly job as message content.
