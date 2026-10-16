import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { IconSearch } from "../../../components/icons";
import { SiteFooter } from "../../../components/SiteHeader";

export const metadata: Metadata = { title: { absolute: "Cortex Docs — How citations work" } };

/*
 * P-04 Docs — "How citations work", Premium v2 (screens/Docs.html).
 * Docs has its own header variant in the design (brand + Docs tag, centred
 * search, Changelog / API status / Open Cortex); the three-column body is
 * left nav / article sheet / "On this page". The designs ship this one
 * article only, so the other nav items and prev/next cards keep the
 * design's "#" hrefs. Brief §7: SiteFooter on Docs too.
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

/* Code-block spans: strings in highlight, punctuation in the block's base tone. */
function S({ children }: { children: ReactNode }) {
  return <span className="pub-s">{children}</span>;
}
function K({ children }: { children: ReactNode }) {
  return <span className="pub-k">{children}</span>;
}

export default function DocsCitationsPage() {
  return (
    <div>
      <header className="pub-dwrap pub-docs-header">
        <div className="pub-docs-brand">
          <Link href="/" className="brand" aria-label="Cortex home">
            <i aria-hidden="true">C</i>
            <b>Cortex</b>
          </Link>
          <span className="tag ln pub-docs-tag">Docs</span>
        </div>
        <span className="pub-docs-search">
          <IconSearch />
          <label htmlFor="dq" className="sr-only">
            Search the docs
          </label>
          <input id="dq" type="search" className="inp" placeholder="Search the docs  /" />
        </span>
        <nav aria-label="Main" className="mnav pub-docs-topnav">
          <Link href="/changelog">Changelog</Link>
          <a href="#">API status</a>
          <Link href="/app/new" className="btn dk">
            Open Cortex
          </Link>
        </nav>
      </header>

      <div className="pub-dwrap pub-docs-grid">
        <nav aria-label="Documentation" className="pub-docs-nav">
          {navGroups.map((group) => (
            <div key={group.title} className="pub-dg">
              <span>{group.title}</span>
              {group.items.map((item) => (
                <a
                  key={item.label}
                  href="#"
                  className="pub-dn"
                  aria-current={item.current ? "page" : undefined}
                >
                  {item.label}
                </a>
              ))}
            </div>
          ))}
        </nav>

        <article className="sheet pub-art">
          <span className="pub-art-meta">Knowledge · updated October 6, 2026</span>
          <h1>How citations work</h1>
          <p className="pub-art-intro">
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
          <pre className="pub-pre" aria-label="Example response">
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
            {" },"}
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

          <div className="pub-pn-row">
            <a href="#" className="pub-pn">
              <span>Previous</span>
              Adding documents
            </a>
            <a href="#" className="pub-pn pub-pn-next">
              <span>Next</span>
              Passages and splitting
            </a>
          </div>
        </article>

        <aside aria-label="On this page" className="pub-toc">
          <span className="pub-toc-title">On this page</span>
          <a href="#find" className="pub-toc-current">
            1. Finding passages
          </a>
          <a href="#set">2. Setting passages aside</a>
          <a href="#api">3. Reading citations through the API</a>
          <span className="pub-toc-card">
            Was this page clear? <a href="#">Tell us what was missing</a>
          </span>
        </aside>
      </div>

      <SiteFooter />
    </div>
  );
}
