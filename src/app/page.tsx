import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "../components/Button";
import { MarginNote, RichSegments } from "../components/Footnote";
import { Meter } from "../components/Meter";
import { SiteFooter, SiteHeader } from "../components/SiteHeader";
import { getTemplates, getThread, getWorkspaceData } from "../lib/api";
import type { MarginNoteData } from "../lib/types";

export const metadata: Metadata = {
  title: "Cortex — Answers that can show their work",
};

/*
 * P-01 Landing. Copy and layout follow the canvas reference
 * (.canvas-ref/screens/P-01-landing/body-clean.html) section by section.
 * The excerpt answer and its footnotes come from the shared thread fixture;
 * the margin notes use the canvas wording (title + match line).
 */
const excerptNotes: MarginNoteData[] = [
  {
    id: "note-1",
    n: 1,
    paragraphId: "landing-excerpt",
    documentTitle: "Customer interview synthesis, p. 14",
    catalog: "Catalog 02",
    meta: "Match 0.91 · Oct 2",
    excerpt: [],
  },
  {
    id: "note-2",
    n: 2,
    paragraphId: "landing-excerpt",
    documentTitle: "Procurement call notes, Northwind",
    catalog: "Catalog 02",
    meta: "Match 0.86 · Sep 30",
    excerpt: [],
  },
  {
    id: "note-3",
    n: 3,
    paragraphId: "landing-excerpt",
    documentTitle: "Product council synthesis",
    catalog: "Catalog 04",
    meta: "Match 0.81 · Oct 1",
    excerpt: [
      { text: "“…whether the source was " },
      { text: "current on the day the answer was given", mark: true },
      { text: ".”" },
    ],
  },
];

const trustPoints = [
  {
    term: "Your documents train nothing.",
    definition: "They are used to answer your questions and nothing else.",
  },
  {
    term: "Old answers keep their evidence.",
    definition: "Cited passages are stored as they were, for up to seven years.",
  },
  {
    term: "Every change is logged.",
    definition: "Roles, keys, settings and exports, in a log nobody can edit.",
  },
  {
    term: "Single sign-on on Enterprise.",
    definition: "Okta, Entra and Google, with audit export to your SIEM.",
  },
];

const traceRows = [
  { cite: "1", passage: "Customer interview synthesis · 118", match: "0.91", aside: false, warn: "" },
  { cite: "2", passage: "Procurement call notes · 22", match: "0.86", aside: false, warn: "" },
  { cite: "—", passage: "Interview round 1 · 7", match: "0.72", aside: true, warn: " · over 30 days old" },
  { cite: "—", passage: "Customer interview synthesis · 77 · below 0.70", match: "0.66", aside: true, warn: "" },
];

function MarketingH2({ children }: { children: string }) {
  return (
    <h2
      style={{
        fontFamily: "var(--font-serif)",
        fontSize: 40,
        lineHeight: 1.1,
        fontWeight: 600,
        letterSpacing: "-0.02em",
        color: "var(--ink)",
        maxWidth: "16ch",
      }}
    >
      {children}
    </h2>
  );
}

export default function LandingPage() {
  const thread = getThread();
  const workspace = getWorkspaceData().workspace;
  const featured = getTemplates().featured;
  const excerptBlock = thread.turns[0]?.answer.blocks[0];
  const excerptSegments = excerptBlock?.type === "paragraph" ? excerptBlock.segments ?? [] : [];

  return (
    <div>
      <SiteHeader current="/" />

      {/* Hero */}
      <section className="site-wrap" style={{ paddingTop: 96, paddingBottom: 72 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <h1 className="display-xl" style={{ maxWidth: "12ch" }}>
            Answers that can show their work.
          </h1>
          <p className="serif-lead" style={{ fontSize: 22, maxWidth: "34em" }}>
            Cortex is a research workspace for teams that have to forward what they find. Every claim is
            footnoted to the passage it came from, every good prompt becomes a playbook, and every answer
            shows its cost before it is written.
          </p>
          <div className="row" style={{ gap: 10 }}>
            <ButtonLink href="/signup" variant="primary" size="lg">
              Start free for 14 days
            </ButtonLink>
            <ButtonLink href="/app/c/launch-evidence" variant="secondary" size="lg">
              See a real thread
            </ButtonLink>
            <span className="ui-text muted-3" style={{ marginLeft: 6 }}>
              No card. $20 of model use included.
            </span>
          </div>
        </div>
      </section>

      {/* Product excerpt */}
      <section aria-label="Example answer" className="site-wrap" style={{ paddingBottom: 104 }}>
        <div
          style={{
            borderTop: "1px solid var(--ink)",
            paddingTop: 28,
            display: "flex",
            flexWrap: "wrap",
            gap: 56,
          }}
        >
          <div style={{ flex: "1 1 520px", maxWidth: 680 }} className="stack-4">
            <span className="caption" style={{ color: "var(--ink-4)", fontSize: 13 }}>
              Asked of 426 interview passages · $0.014
            </span>
            <p
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: 30,
                lineHeight: 1.25,
                fontWeight: 600,
                letterSpacing: "-0.015em",
                color: "var(--ink)",
              }}
            >
              {thread.header.title}
            </p>
            <p className="answer-text" style={{ fontSize: 20 }}>
              <RichSegments segments={excerptSegments} />
            </p>
          </div>
          <div
            className="margin-stack"
            style={{ flex: "1 1 240px", maxWidth: 300, paddingTop: 30, fontSize: 13 }}
          >
            {excerptNotes.map((note) => (
              <MarginNote key={note.id} note={note} />
            ))}
          </div>
        </div>
      </section>

      {/* 1 · Evidence */}
      <section className="site-wrap marketing-section">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 56 }}>
          <div style={{ flex: "1 1 420px" }} className="stack-4">
            <span className="section-number">1 · Evidence</span>
            <MarketingH2>Every claim opens the passage behind it.</MarketingH2>
            <p className="serif-lead" style={{ fontSize: 19, lineHeight: 1.6, maxWidth: "34em" }}>
              Cortex reads your documents in passages, not pages. It shows you which ones it used, which it
              set aside, and why — so when an answer is wrong you can see whether the problem was the
              question, the source or the search.
            </p>
          </div>
          <div
            className="fragment"
            role="img"
            aria-label="Retrieval trace: four passages cited, one set aside because it was over 30 days old, one below the match minimum."
            style={{ flex: "1 1 420px", maxWidth: 520, alignSelf: "flex-start", fontSize: 13 }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "26px minmax(0, 1fr) 46px",
                gap: 12,
                padding: "8px 0",
                color: "var(--ink-4)",
                fontSize: 12,
              }}
            >
              <span>Cite</span>
              <span>Passage</span>
              <span style={{ textAlign: "right" }}>Match</span>
            </div>
            {traceRows.map((row) => (
              <div
                key={`${row.passage}-${row.match}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "26px minmax(0, 1fr) 46px",
                  gap: 12,
                  padding: "9px 0",
                  borderTop: "1px solid var(--rule)",
                  color: row.aside ? "var(--ink-3)" : undefined,
                }}
              >
                <strong style={{ fontWeight: row.aside ? 400 : 600 }}>{row.cite}</strong>
                <span>
                  {row.passage}
                  {row.warn ? <span className="warn-text">{row.warn}</span> : null}
                </span>
                <span style={{ textAlign: "right" }}>{row.match}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2 · Playbooks */}
      <section className="site-wrap marketing-section">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 56 }}>
          <div style={{ flex: "1 1 420px" }} className="stack-4">
            <span className="section-number">2 · Playbooks</span>
            <MarketingH2>The prompt that worked becomes the team’s.</MarketingH2>
            <p className="serif-lead" style={{ fontSize: 19, lineHeight: 1.6, maxWidth: "34em" }}>
              Save a good request as a playbook with inputs, approved sources and checks. Anyone on the team
              can run it; a run that fails its checks is marked, never quietly shared.
            </p>
          </div>
          <div
            className="fragment stack-3"
            style={{ flex: "1 1 420px", maxWidth: 520, alignSelf: "flex-start" }}
          >
            <span className="caption" style={{ color: "var(--ink-4)" }}>
              {featured.name} · {featured.runs}
            </span>
            <p
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: 17,
                lineHeight: 1.65,
                color: "var(--ink-body)",
              }}
            >
              Write a launch brief for{" "}
              <span className="dotted-input" style={{ fontFamily: "var(--font-sans)", fontSize: 15 }}>
                product
              </span>{" "}
              aimed at{" "}
              <span className="dotted-input" style={{ fontFamily: "var(--font-sans)", fontSize: 15 }}>
                audience
              </span>
              . State the single promise in one sentence, then the three strongest pieces of proof…
            </p>
          </div>
        </div>
      </section>

      {/* 3 · Cost */}
      <section className="site-wrap marketing-section">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 56 }}>
          <div style={{ flex: "1 1 420px" }} className="stack-4">
            <span className="section-number">3 · Cost</span>
            <MarketingH2>You see the price before the answer.</MarketingH2>
            <p className="serif-lead" style={{ fontSize: 19, lineHeight: 1.6, maxWidth: "34em" }}>
              Set a ceiling per answer and a limit per month. Cortex estimates each reply before writing it
              and stops at the line you drew, without touching anything already written.
            </p>
          </div>
          <div
            className="fragment"
            style={{ flex: "1 1 420px", maxWidth: 520, alignSelf: "flex-start" }}
          >
            <Meter
              sentence={
                <>
                  <strong style={{ fontWeight: 600 }}>${workspace.spend}</strong> of the $
                  {workspace.monthlyLimit} limit is spent with three days left. At this pace the workspace
                  reaches the limit around <strong style={{ fontWeight: 600 }}>October 8</strong>.
                </>
              }
              value={workspace.spend}
              max={workspace.monthlyLimit}
              caption="About $0.012 for this reply. $0.030 left of this thread’s $0.08 limit."
              label={`$${workspace.spend} of $${workspace.monthlyLimit} spent`}
            />
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="site-wrap marketing-section" style={{ paddingBottom: 96 }}>
        <div className="stack-6" style={{ gap: 32 }}>
          <div className="stack-4">
            <span className="section-number">For the people who review it</span>
            <h2
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: 40,
                lineHeight: 1.1,
                fontWeight: 600,
                letterSpacing: "-0.02em",
                color: "var(--ink)",
                maxWidth: "22ch",
              }}
            >
              What security and legal will ask, answered up front.
            </h2>
          </div>
          <dl
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "28px 40px",
              fontSize: 15,
              lineHeight: 1.55,
            }}
          >
            {trustPoints.map((point) => (
              <div key={point.term}>
                <dt style={{ fontWeight: 600, color: "var(--ink)" }}>{point.term}</dt>
                <dd style={{ marginTop: 6, color: "var(--ink-2)" }}>{point.definition}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* CTA band */}
      <section className="cta-band">
        <div
          className="site-wrap"
          style={{
            paddingTop: 88,
            paddingBottom: 88,
            display: "flex",
            flexWrap: "wrap",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 32,
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: 52,
              lineHeight: 1.05,
              fontWeight: 600,
              letterSpacing: "-0.03em",
              maxWidth: "14ch",
              color: "var(--on-ink)",
            }}
          >
            Bring one question and the documents behind it.
          </h2>
          <div className="stack-3" style={{ alignItems: "flex-start" }}>
            <Link
              href="/signup"
              className="btn btn-lg"
              style={{ background: "var(--on-ink)", borderColor: "var(--on-ink)", color: "var(--ink)" }}
            >
              Start free for 14 days
            </Link>
            <span style={{ fontSize: 13 }}>
              $30 per seat after the trial ·{" "}
              <Link href="/pricing" style={{ color: "var(--on-ink)" }}>
                pricing
              </Link>
            </span>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
