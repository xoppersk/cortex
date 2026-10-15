import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { ButtonLink } from "../../../components/Button";
import { Icon } from "../../../components/Icon";
import { SiteBrand, SiteFooter } from "../../../components/SiteHeader";

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

/* Code-block spans: strings in --highlight, punctuation in the block's base tone. */
function S({ children }: { children: ReactNode }) {
  return <span className="pm-code-s">{children}</span>;
}
function K({ children }: { children: ReactNode }) {
  return <span className="pm-code-k">{children}</span>;
}

export default function DocsCitationsPage() {
  return (
    <div className="pm-page">
      <header className="pm-dwrap pm-head">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <SiteBrand />
          <span className="pv-tag pv-tag-ln" style={{ height: 22, fontSize: 12.5 }}>
            Docs
          </span>
        </div>
        <span className="pm-search pm-docs-search">
          <label htmlFor="docs-search" className="sr-only">
            Search the docs
          </label>
          <Icon name="search" />
          <input id="docs-search" type="search" placeholder="Search the docs  /" className="pv-inp" />
        </span>
        <nav aria-label="Main" className="pm-nav" style={{ alignItems: "center", gap: 6 }}>
          <Link href="/changelog">Changelog</Link>
          <a href="#">API status</a>
          <ButtonLink href="/app/new" variant="primary" className="pm-btn-head" style={{ marginLeft: 6, color: "var(--on-ink)", fontWeight: 500 }}>
            Open Cortex
          </ButtonLink>
        </nav>
      </header>

      <div className="pm-dwrap pm-docs">
        <nav aria-label="Documentation" className="pm-docs-nav">
          {navGroups.map((group) => (
            <div key={group.title} className="pm-dg">
              <span>{group.title}</span>
              {group.items.map((item) => (
                <span key={item.label} className="pm-dn" aria-current={item.current ? "page" : undefined}>
                  {item.label}
                </span>
              ))}
            </div>
          ))}
        </nav>

        <main className="pm-sheet pm-art">
          <article style={{ display: "contents" }}>
            <span style={{ fontSize: 12.5, color: "var(--ink-4)" }}>Knowledge · updated October 6, 2026</span>
            <h1>How citations work</h1>
            <p style={{ fontSize: 20, lineHeight: 1.6, paddingBottom: 6 }}>
              Every factual claim in a Cortex answer points to one passage. This page explains how those passages are chosen,
              why some are set aside, and how to read the result through the API.
            </p>

            <h2 id="find">1. Finding passages</h2>
            <p>
              When you ask a question, Cortex searches the knowledge bases attached to the conversation and returns the eight
              passages that match best. Each one gets a match score between 0 and 1. Passages below the workspace minimum,{" "}
              <code>0.70</code> by default, are never read.
            </p>

            <h2 id="set">2. Setting passages aside</h2>
            <p>
              Of the passages that clear the minimum, Cortex sets aside any that repeat another passage, fall outside your
              freshness rule, or turn out not to address the question. The reason is recorded and shown under the answer, so a
              missing citation is never a mystery.
            </p>

            <h2 id="api">3. Reading citations through the API</h2>
            <p>
              The <code>/v1/ask</code> response lists every passage that was read, with its outcome.
            </p>
          <pre className="pm-code" aria-label="Example response">
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
              The <code>outcome</code> field is one of <code>cited</code>, <code>duplicate</code>, <code>stale</code>,{" "}
              <code>off_topic</code> or <code>below_minimum</code>.
            </p>

            {/* Only this article is designed: previous/next are honest placeholders, not links. */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 26 }}>
              <span className="pm-pn">
                <span>Previous</span>Adding documents
              </span>
              <span className="pm-pn" style={{ textAlign: "right" }}>
                <span>Next</span>Passages and splitting
              </span>
            </div>
          </article>
        </main>

        <aside aria-label="On this page" className="pm-toc">
          <span className="pm-toc-title">On this page</span>
          <a href="#find" aria-current="location">
            1. Finding passages
          </a>
          <a href="#set">2. Setting passages aside</a>
          <a href="#api">3. Reading citations through the API</a>
          <span className="pm-toc-ask">
            Was this page clear? <a href="#">Tell us what was missing</a>
          </span>
        </aside>
      </div>

      <SiteFooter />
    </div>
  );
}
