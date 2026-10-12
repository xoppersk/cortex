import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ButtonLink } from "../../../components/Button";
import { getConversations, getStates } from "../../../lib/api";
import { HistoryFilters } from "./history-filters";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  const params = await searchParams;
  return {
    title: {
      absolute:
        params.state === "empty" ? "Cortex — Empty conversation" : "Cortex — Conversation history",
    },
  };
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;

  if (params.state === "empty") {
    const empty = getStates().emptyHistory;
    return (
      <div style={{ paddingTop: 80 }}>
        <div className="doc-margin">
          <div className="doc-column" style={{ maxWidth: 620 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <p className="caption" style={{ color: "var(--ink-4)", margin: 0 }}>
                {empty.caption}
              </p>
              <h1
                className="page-title"
                style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.025em", margin: 0 }}
              >
                {empty.heading}
              </h1>
              <p className="summary-sentence" style={{ fontSize: 19, margin: 0 }}>
                {empty.body}
              </p>
            </div>
            <div style={{ marginTop: 36 }}>
              <p style={{ fontSize: 12, color: "var(--ink-4)", paddingBottom: 8, margin: 0 }}>
                Or start from one of these
              </p>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {empty.starters.map((starter, index) => (
                  <Link
                    key={starter}
                    href="/app/new"
                    style={{
                      fontFamily: "var(--font-serif)",
                      fontSize: 17,
                      lineHeight: 1.5,
                      color: "var(--ink)",
                      textDecoration: "none",
                      padding: "14px 0",
                      borderTop: "1px solid var(--rule)",
                      borderBottom:
                        index === empty.starters.length - 1 ? "1px solid var(--rule)" : undefined,
                    }}
                  >
                    {starter}
                  </Link>
                ))}
              </div>
            </div>
            <div style={{ marginTop: 30 }}>
              <ButtonLink
                href="/app/new"
                variant="primary"
                size="lg"
                style={{ minHeight: 40, fontSize: 14 }}
              >
                Start a sourced conversation
              </ButtonLink>
            </div>
          </div>
          <aside className="margin-column" style={{ paddingTop: 30 }} aria-label="Ready to cite">
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                fontSize: 12,
                lineHeight: 1.5,
                color: "var(--ink-2)",
              }}
            >
              <h2 className="margin-box-title" style={{ margin: 0 }}>
                Ready to cite
              </h2>
              {empty.readyToCite.map((item) => {
                if (item === "Add your own documents") {
                  return (
                    <Link key={item} href="/app/knowledge/documents">
                      {item}
                    </Link>
                  );
                }
                const [name, ...rest] = item.split(" · ");
                return (
                  <p key={item} style={{ margin: 0 }}>
                    <span style={{ fontWeight: 500, color: "var(--ink)" }}>{name}</span>
                    {rest.length ? ` · ${rest.join(" · ")}` : null}
                  </p>
                );
              })}
            </div>
          </aside>
        </div>
      </div>
    );
  }

  const data = getConversations();
  return (
    <div>
      <div className="page-head">
        <div className="page-head-row" style={{ alignItems: "flex-end" }}>
          <div>
            <h1 className="page-title">Conversations</h1>
            <p className="meta" style={{ marginTop: 6 }}>
              {data.conversations.length} conversations · {data.sharedWithYou} shared with you
            </p>
          </div>
          <ButtonLink href="/app/new" variant="primary" size="sm" style={{ minHeight: 32 }}>
            New conversation
          </ButtonLink>
        </div>
      </div>
      <Suspense fallback={<p className="caption">Loading conversations…</p>}>
        <HistoryFilters />
      </Suspense>
    </div>
  );
}
