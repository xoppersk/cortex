# Prompt Templates Guide

Templates turn your best prompts into reusable team playbooks. Instead of retyping a long prompt every week, you fill in a few variables and go.

## Creating a template

Open Templates → New template. Give it a name, a description, and a category (Marketing, Sales, Engineering, Ops, or your own). Write the prompt body with `{{variable}}` placeholders, for example:

> Write a {{tone}} cold email to {{prospect}} about {{product}}. Keep it under {{max_words}} words.

Click "insert variable" to add placeholders without typing the braces. Each variable gets a label, an optional default value, and a required flag.

## Using a template

Click Use on any template card. You get a fill-in form — one field per variable — then "Start chat" opens a conversation with your values substituted. The run is attributed to the template, so admins can see which playbooks get used.

## Sharing with the team

Templates are Personal by default (only you see them). Switch visibility to Team to share. Admins can feature the best templates so new hires find them first. Editing a template bumps its version and keeps the full history — you can view any prior version.

## Variable edge cases

Variables accept multiline text and special characters safely; values are escaped before substitution and never interpreted as instructions. Empty required variables block the form with a clear message; optional variables fall back to their defaults.

## Organizing at scale

Use categories plus search to navigate large libraries. The Templates page shows run counts per template — prune anything with zero runs in 90 days during your quarterly cleanup.
