import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "../../../components/Button";

export const metadata: Metadata = { title: "How citations work · Docs" };

/*
 * P-04 Docs — "How citations work". Three-column layout and copy follow the
 * canvas reference (.canvas-ref/screens/P-04-docs/body-clean.html).
 * Nav groups per the approved design: Start here / Knowledge / Teams / API.
 */
const navGroups: Array<{ title: string; items: Array<{ label: string; current?: boolean }> }> = [
  {
    title: "Start here",
    items: [{ label: "What Cortex is" }, { label: "Your first cited answer" }, { label: "Inviting your team" }],
  },
  {
    title: "Knowledge",
    items: [
      { label: "Adding documents" },
      { label: "How citations work", current: true },
      { label: "Passages and splitting" },
      { label: "Freshness rules" },
    ],
  },
  {
    title: "Teams",
    items: [{ label: "Playbooks" }, { label: "Evaluations" }, { label: "Spending limits" }],
  },
  {
    title: "API",
    items: [{ label: "Authentication" }, { label: "Ask endpoint" }, { label: "Errors" }],
  },
];

const citationJson = `{
  "answer": "Seven of nine teams said…[1]",
  "cost_usd": 0.014,
  "passages": [
    { "cite": 1, "document": "Customer interview synthesis",
      "passage": 118, "match": 0.91, "outcome": "cited" },
    { "cite": null, "document": "Interview round 1 notes",
      "passage": 7, "match": 0.72, "outcome": "stale" }
  ]
}`;

export default function DocsCitationsPage() {
  return (
    <div>
      {/* Docs header (canvas variant, built inline rather than SiteHeader) */}
      <header
        style={{
          padding: "16px 32px",
          borderBottom: "1px solid var(--rule)",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <Link href="/" className="wordmark">
            Cortex
          </Link>
          <span style={{ fontSize: 14, color: "var(--ink-3)" }}>Docs</span>
        </div>
        <label htmlFor="docs-search" className="sr-only">
          Search the docs
        </label>
        <input
          id="docs-search"
          type="search"
          placeholder="Search the docs  /"
          className="field-control"
          style={{ flex: "0 1 360px", minHeight: 34 }}
        />
        <nav aria-label="Main" className="site-nav" style={{ gap: 22, alignItems: "center" }}>
          <Link href="/changelog" className="text-link">
            Changelog
          </Link>
          <Link href="/docs/citations" className="text-link">
            API status
          </Link>
          <ButtonLink href="/app/new" variant="primary" size="md">
            Open Cortex
          </ButtonLink>
        </nav>
      </header>

      <div className="docs-layout">
        <nav aria-label="Documentation" className="docs-nav">
          {navGroups.map((group) => (
            <div key={group.title}>
              <span className="nav-section-title" style={{ display: "block" }}>
                {group.title}
              </span>
              {group.items.map((item) => (
                <Link
                  key={item.label}
                  href="/docs/citations"
                  className="nav-item"
                  aria-current={item.current ? "page" : undefined}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <article className="docs-article" style={{ paddingTop: 44, paddingBottom: 96 }}>
          <span style={{ fontSize: 13, color: "var(--ink-3)" }}>Knowledge · updated October 6, 2026</span>
          <h1
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: 44,
              lineHeight: 1.08,
              fontWeight: 600,
              letterSpacing: "-0.025em",
              color: "var(--ink)",
            }}
          >
            How citations work
          </h1>
          <p style={{ fontFamily: "var(--font-serif)", fontSize: 20, lineHeight: 1.6 }}>
            Every factual claim in a Cortex answer points to one passage. This page explains how those
            passages are chosen, why some are set aside, and how to read the result through the API.
          </p>

          <h2 id="find">1. Finding passages</h2>
          <p>
            When you ask a question, Cortex searches the knowledge bases attached to the conversation and
            returns the eight passages that match best. Each one gets a match score between 0 and 1.
            Passages below the workspace minimum, <code>0.70</code> by default, are never read.
          </p>

          <h2 id="set">2. Setting passages aside</h2>
          <p>
            Of the passages that clear the minimum, Cortex sets aside any that repeat another passage, fall
            outside your freshness rule, or turn out not to address the question. The reason is recorded
            and shown under the answer, so a missing citation is never a mystery.
          </p>

          <h2 id="api">3. Reading citations through the API</h2>
          <p>
            The <code>/v1/ask</code> response lists every passage that was read, with its outcome.
          </p>
          <pre className="code-block" aria-label="Example response">
            {citationJson}
          </pre>
          <p>
            The <code>outcome</code> field is one of <code>cited</code>, <code>duplicate</code>,{" "}
            <code>stale</code>, <code>off_topic</code> or <code>below_minimum</code>.
          </p>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              gap: 16,
              marginTop: 28,
              paddingTop: 20,
              borderTop: "1px solid var(--rule)",
              fontSize: 14,
            }}
          >
            <Link href="/docs/citations" style={{ textDecoration: "none" }}>
              <span style={{ display: "block", fontSize: 12, color: "var(--ink-3)" }}>Previous</span>
              Adding documents
            </Link>
            <Link href="/docs/citations" style={{ textDecoration: "none", textAlign: "right" }}>
              <span style={{ display: "block", fontSize: 12, color: "var(--ink-3)" }}>Next</span>
              Passages and splitting
            </Link>
          </div>
        </article>

        <aside aria-label="On this page" className="docs-toc" style={{ paddingTop: 48 }}>
          <span style={{ color: "var(--ink-4)" }}>On this page</span>
          <a href="#find" style={{ color: "var(--ink)", textDecoration: "none", fontWeight: 500 }}>
            1. Finding passages
          </a>
          <a href="#set" style={{ color: "var(--ink-2)", textDecoration: "none" }}>
            2. Setting passages aside
          </a>
          <a href="#api" style={{ color: "var(--ink-2)", textDecoration: "none" }}>
            3. Reading citations through the API
          </a>
          <span
            style={{
              marginTop: 18,
              paddingTop: 14,
              borderTop: "1px solid var(--rule)",
              color: "var(--ink-3)",
              lineHeight: 1.5,
            }}
          >
            Was this page clear? <Link href="/docs/citations">Tell us what was missing</Link>
          </span>
        </aside>
      </div>
    </div>
  );
}
