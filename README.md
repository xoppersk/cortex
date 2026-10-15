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
- Fonts self-hosted with `next/font/local` (latin subsets in `src/app/fonts/`,
  SIL OFL): Source Serif 4 (variable, with optical sizes), IBM Plex Sans,
  IBM Plex Mono. Builds need no network access.
- Fixtures: typed JSON under `data/`, one canon (Sevyn Labs workspace,
  $184 of the $200 monthly limit spent, 24 conversations, 5 collections /
  32 documents / 1,842 passages). Every number on every screen derives from
  these files; `src/lib/fixtures.test.ts` verifies the cross-sums.

## Design rules — Premium v2 (approved Oct 2026)

Premium v2 supersedes the earlier "no shadows, max radius 8px, no pills"
rules. The tokens live in `src/app/globals.css`; the Premium v2 layer uses
`pv-` class names.

- **Shell.** A 248px rail on the `#F3F3F1` ground: C monogram and workspace,
  ⌘K search, the "New conversation" button (⌘N), icon navigation with mono
  counts (the current page is a white card on a hairline ring), a Recent list,
  the spend card (meter with the 90% alert tick) and the user row. Every app
  screen sits in **one white workspace panel** with a 16px radius.
- **Surfaces.** Cards use a hairline ring shadow instead of a border:
  `--shadow-ring` / `--shadow-card` by default, `--shadow-lift` for the
  selected source, raised passage or popover. No other shadows, no gradients
  or glows.
- **Corners.** Only `--radius-s` 4px (chips, citation pills, tags),
  `--radius-m` 8px (buttons, inputs, nav items), `--radius-l` 12px (cards,
  panels, composer), `--radius-xl` 16px (the workspace panel, floating
  composers) and `--radius-pill` (segmented controls, status pills, avatars).
- **Answers.** Source Serif 4 for everything Cortex says. Citations are
  numbered pills (the selected one inverts to ink); every finished answer
  ends with a provenance line ("5 of 5 claims cited · tokens · time · cost").
  Unsourced lines carry a dashed "Not sourced" tag.
- **One mark of colour.** `--highlight` (#F2E27D) marks cited evidence,
  search matches, playbook inputs and the single key figure in a summary
  sentence — never buttons, borders or decoration. State colours (`--warn`,
  `--danger`) are for text, dots and tinted tags only.
- **Type.** IBM Plex Sans for the interface (tabular numbers), IBM Plex Mono
  for numbers people compare or copy (costs, counts, keys). Page titles 24px
  in the panel header; display titles 40–44px; section labels are small
  letter-spaced caps. Text never below 11px.
- **Icons.** Small inline SVG strokes (1.5–1.8px) from
  `src/components/Icon.tsx`. No emoji, no icon fonts.
- One primary (ink) button per view. Summaries are written sentences.

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
