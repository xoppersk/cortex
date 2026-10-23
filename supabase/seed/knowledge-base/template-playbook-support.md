# Template Playbook: Support Macros

Support teams use these templates to keep tone consistent while resolving tickets fast.

## Empathetic refund response

Variables: {{customer_name}}, {{product}}, {{policy_summary}}.

> Write a support reply to {{customer_name}} about a refund request for {{product}}. Policy: {{policy_summary}}. Be warm and direct: acknowledge the frustration in one sentence, state the decision plainly, and offer the best alternative we can (credit, extension, or workaround). Under 150 words.

## Bug triage summary

Variables: {{ticket_text}}.

> Turn this ticket into an engineering-ready bug report: {{ticket_text}}. Output: Summary (one line), Steps to reproduce (numbered), Expected vs actual, Environment guesses, Severity (P1-P4) with one-line justification. If information is missing, list exactly what to ask the customer.

## Changelog to customer email

Variables: {{feature}}, {{benefit}}, {{audience}}.

> Announce {{feature}} to {{audience}}. Lead with the benefit ({{benefit}}), then what changed in two bullets, then one sentence on how to try it. Tone: helpful, never hypey. End with where to send feedback.
