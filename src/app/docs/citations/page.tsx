import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { ButtonLink } from "../../../components/Button";
import { SiteFooter } from "../../../components/SiteHeader";

export const metadata: Metadata = { title: { absolute: "Cortex Docs — How citations work" } };

/*
 * P-04 Docs — "How citations work". Three-column layout and copy follow the
 * canvas reference (.canvas-ref/screens/P-04-docs/body-clean.html).
 * Nav groups per the approved design: Start here / Knowledge / Teams / API.
 * The designs ship this one article only: the other 12 nav items and the
 * prev/next cards are honest non-link placeholders (spans in the design's
 * .dn style), not self-links to this page. "API status" and the feedback
 * link keep the design's "#" hrefs. Brief §7: SiteFooter on Docs too.
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

/* Design .dn nav-item style (canvas wins over the app NavItem spec). */
const docsNavItem: CSSProperties = {
  display: "block",
  padding: "5px 10px",
  borderRadius: 5,
  fontSize: 14,
  color: "var(--ink-2)",
  textDecoration: "none",
};

const docsNavCurrent: CSSProperties = {
  ...docsNavItem,
  background: "var(--hover)",
  color: "var(--ink)",
  fontWeight: 500,
};

/* Code-block spans: strings in --highlight, punctuation in the block's base tone. */
function S({ children }: { children: ReactNode }) {
  return <span style={{ color: "var(--highlight)" }}>{children}</span>;
}
function K({ children }: { children: ReactNode }) {
  return <span style={{ color: "#C9C9C3" }}>{children}</span>;
}

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
          style={{ flex: "0 1 360px", minHeight: 34, fontSize: 14 }}
        />
        <nav aria-label="Main" className="site-nav" style={{ gap: 22, alignItems: "center" }}>
          <Link href="/changelog" className="text-link">
            Changelog
          </Link>
          <a href="#" className="text-link">
            API status
          </a>
          <ButtonLink href="/app/new" variant="primary" size="md" style={{ minHeight: 34, fontSize: 14 }}>
            Open Cortex
          </ButtonLink>
        </nav>
      </header>

      <div className="docs-layout">
        <nav aria-label="Documentation" className="docs-nav">
          {navGroups.map((group) => (
            <div key={group.title}>
              <span
                className="nav-section-title"
                style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--ink)" }}
              >
                {group.title}
              </span>
              {group.items.map((item) =>
                item.current ? (
                  <span key={item.label} style={docsNavCurrent} aria-current="page">
                    {item.label}
                  </span>
                ) : (
                  <span key={item.label} style={docsNavItem}>
                    {item.label}
                  </span>
                ),
              )}
            </div>
          ))}
        </nav>

        <article className="docs-article" style={{ paddingTop: 44, paddingBottom: 96, flex: "999 1 560px" }}>
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
            <K>{"{"}</K>
            {"\n  "}
            <S>&quot;answer&quot;</S>: <S>&quot;Seven of nine teams said…[1]&quot;</S>,
            {"\n  "}
            <S>&quot;cost_usd&quot;</S>: 0.014,
            {"\n  "}
            <S>&quot;passages&quot;</S>: [
            {"\n    { "}
            <S>&quot;cite&quot;</S>: 1, <S>&quot;document&quot;</S>: <S>&quot;Customer interview synthesis&quot;</S>,
            {"\n      "}
            <S>&quot;passage&quot;</S>: 118, <S>&quot;match&quot;</S>: 0.91, <S>&quot;outcome&quot;</S>: <S>&quot;cited&quot;</S>
            {" }"}
            {"\n    { "}
            <S>&quot;cite&quot;</S>: null, <S>&quot;document&quot;</S>: <S>&quot;Interview round 1 notes&quot;</S>,
            {"\n      "}
            <S>&quot;passage&quot;</S>: 7, <S>&quot;match&quot;</S>: 0.72, <S>&quot;outcome&quot;</S>: <S>&quot;stale&quot;</S>
            {" }"}
            {"\n  ]\n"}
            <K>{"}"}</K>
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
            <span>
              <span style={{ display: "block", fontSize: 12, color: "var(--ink-3)" }}>Previous</span>
              Adding documents
            </span>
            <span style={{ textAlign: "right" }}>
              <span style={{ display: "block", fontSize: 12, color: "var(--ink-3)" }}>Next</span>
              Passages and splitting
            </span>
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
            Was this page clear? <a href="#">Tell us what was missing</a>
          </span>
        </aside>
      </div>

      <div className="hairline-top">
        <SiteFooter />
      </div>
    </div>
  );
}
