import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ButtonLink } from "../../../components/Button";
import { Icon } from "../../../components/Icon";
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
    const ready = empty.readyToCite.filter((item) => item !== "Add your own documents");
    return (
      <div className="pv-split">
        <div className="pv-empty-main">
          <span className="pv-tag pv-tag-ln">
            <Icon name="chat" style={{ width: 12, height: 12, color: "var(--ink-3)" }} />
            {empty.caption}
          </span>
          <h1 className="pv-display-title" style={{ margin: "4px 0 0", fontSize: 44, lineHeight: 1.08, letterSpacing: "-0.028em" }}>
            {empty.heading}
          </h1>
          <p className="pv-config" style={{ lineHeight: 1.65 }}>
            {empty.body}
          </p>
          <div style={{ alignSelf: "stretch", display: "flex", flexDirection: "column", gap: 12, marginTop: 22 }}>
            <h2 className="pv-lbl">Or start from one of these</h2>
            <div className="pv-card pv-rows" style={{ overflow: "hidden" }}>
              {empty.starters.map((starter) => (
                <Link key={starter} href="/app/new" className="pv-row pv-starter">
                  <span className="pv-ib" aria-hidden="true">
                    <Icon name="chat" />
                  </span>
                  <span>{starter}</span>
                  <Icon name="arrowRight" style={{ color: "var(--ink-3)" }} />
                </Link>
              ))}
            </div>
          </div>
          <ButtonLink href="/app/new" variant="primary" size="lg" style={{ marginTop: 10, padding: "0 16px" }}>
            Start a sourced conversation
            <Icon name="arrowRight" style={{ color: "currentColor" }} />
          </ButtonLink>
        </div>
        <aside className="pv-side" aria-label="Ready to cite" style={{ paddingTop: 96, gap: 16 }}>
          <h2 className="pv-lbl">Ready to cite</h2>
          {ready.map((item) => {
            const [name, ...rest] = item.split(" · ");
            return (
              <div key={item} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span className="pv-chk" aria-hidden="true">
                  <Icon name="check" strokeWidth={1.8} style={{ width: 12, height: 12, color: "currentColor" }} />
                </span>
                <span style={{ fontSize: 12, lineHeight: 1.45, color: "var(--ink-3)" }}>
                  <b>{name}</b>
                  {rest.length ? ` · ${rest.join(" · ")}` : null}
                </span>
              </div>
            );
          })}
          <ButtonLink href="/app/knowledge/documents" variant="secondary" size="sm" style={{ alignSelf: "flex-start", marginTop: 6 }}>
            <Icon name="file" style={{ color: "var(--ink-2)" }} />
            Add your own documents
          </ButtonLink>
        </aside>
      </div>
    );
  }

  const data = getConversations();
  return (
    <>
      <header className="pv-ph">
        <div className="pv-ph-title">
          <h1>Conversations</h1>
          <span className="pv-ph-sub">
            {data.conversations.length} conversations · {data.sharedWithYou} shared with you
          </span>
        </div>
        <ButtonLink href="/app/new" variant="primary">
          <Icon name="plus" strokeWidth={1.8} style={{ color: "currentColor" }} />
          New conversation
        </ButtonLink>
      </header>
      <Suspense fallback={<p className="pv-body caption">Loading conversations…</p>}>
        <HistoryFilters />
      </Suspense>
    </>
  );
}
