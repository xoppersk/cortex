# Cortex

**Answers that can show their work.**

Cortex is a research workspace for teams. You ask a question against your own
documents; the answer is written like a document, every claim is footnoted to
the exact passage it came from, and the sources sit in the margin next to the
paragraph they support. Teams save good prompts as playbooks, test answer
quality with evaluations, and control cost with per-answer and monthly
spending limits.

This repository is the front end, built exactly to the approved design
(35 screens). There is no backend in this phase: all data comes from one
typed fixture set behind `src/lib/api.ts`, so a real API can replace it later
without touching the screens.

## Stack

- Next.js 16 (App Router) + TypeScript
- Plain CSS variables — no UI kit, no Tailwind palette. Tokens live in
  `src/app/globals.css` (`:root` light theme, `[data-theme="dark"]` variant).
- Fonts via `next/font/google`: Source Serif 4, IBM Plex Sans, IBM Plex Mono.
- Fixtures: typed JSON under `data/`, one canon (Sevyn Labs workspace,
  $184 of the $200 monthly limit spent, 24 conversations, 5 collections /
  32 documents / 1,842 passages). Every number on every screen derives from
  these files; `src/lib/fixtures.test.ts` verifies the cross-sums.

## Design rules (non-negotiable)

- Ink on paper. The only accent is `--highlight`, and it only marks words
  taken from a source or a search match — never buttons, borders or decoration.
- No shadows, gradients, glows, emoji, pill badges or KPI tiles. Hierarchy
  comes from hairlines, weight and position.
- One primary button per view. Summaries are written sentences, not number
  cards. Max radius 8px. Text never below 12px.

## Routes

| Area | Routes |
| :-- | :-- |
| Workspace | `/app/new`, `/app/c/[id]`, `/app/history`, `/app/playbooks`, `/app/playbooks/[id]/edit`, `/app/usage` |
| Knowledge | `/app/knowledge`, `/app/knowledge/ask`, `/app/knowledge/documents`, `/app/knowledge/documents/[id]`, `/app/evaluations` |
| Settings | `/settings/members`, `/settings/workspace`, `/settings/api-keys`, `/settings/billing`, `/settings/audit`, `/settings/profile` |
| Public | `/`, `/pricing`, `/templates`, `/docs/citations`, `/changelog` |
| System | `/login`, `/signup`, `/invite/[token]`, `/upgrade`, custom 404 |
| Dev | `/dev/components` — every design-system component in its documented states |

System states are reachable in context via query toggles, e.g.
`/app/c/launch-evidence?state=sources-down` (catalog unreachable),
`?state=limit` (monthly limit hit), `/app/new?state=viewer` (Viewer role),
`/app/history?state=empty`, `/signup?state=error`.

## Develop

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm build      # production build
pnpm typecheck  # tsc --noEmit
pnpm test       # vitest — fixture canon checks
pnpm lint       # eslint
```

Dark theme is supported from Personal settings › Appearance
(Light / Dark / Match system) and is built purely from the tokens.
