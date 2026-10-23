import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { IconArrowRight, IconChat, IconCheck } from "../../../components/icons";
import { getConversations, getEmptyHistoryState } from "../../../lib/api";
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

  const data = await getConversations();
  if (params.state === "empty" || data.conversations.length === 0) {
    const empty = await getEmptyHistoryState();
    return (
      <div className="ws-split">
        <div className="ws-doc-empty">
          <span className="tag ln">
            <IconChat style={{ width: 13, height: 13 }} />
            {empty.caption}
          </span>
          <h1 className="ws-empty-h1">{empty.heading}</h1>
          <p className="ws-empty-body">{empty.body}</p>
          <div
            style={{
              alignSelf: "stretch",
              display: "flex",
              flexDirection: "column",
              gap: 12,
              marginTop: 22,
            }}
          >
            <span className="lbl">Or start from one of these</span>
            <div className="card" style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}>
              {empty.starters.map((starter) => (
                <Link key={starter} href="/app/new" className="ws-starter">
                  <span className="ib">
                    <IconChat style={{ width: 15, height: 15 }} />
                  </span>
                  <span>{starter}</span>
                  <IconArrowRight style={{ width: 15, height: 15 }} />
                </Link>
              ))}
            </div>
          </div>
          <Link href="/app/new" className="btn dk ws-empty-cta">
            Start a sourced conversation
            <IconArrowRight style={{ width: 15, height: 15, color: "var(--on-ink)" }} />
          </Link>
        </div>

        <aside className="ws-aside ws-aside-empty" aria-label="Ready to cite">
          <h2 className="lbl">Ready to cite</h2>
          {empty.readyToCite.map((item) => {
            if (item === "Add your own documents") {
              return (
                <Link key={item} href="/app/knowledge/documents" className="btn sm" style={{ alignSelf: "flex-start", marginTop: 6 }}>
                  <svg
                    className="ic"
                    viewBox="0 0 16 16"
                    width="14"
                    height="14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M4 2.5h5l3 3v8H4z" />
                    <path d="M9 2.5v3h3" />
                  </svg>
                  {item}
                </Link>
              );
            }
            const [name, ...rest] = item.split(" · ");
            return (
              <div key={item} className="ws-ready-row">
                <span className="ws-chk">
                  <IconCheck style={{ width: 12, height: 12, color: "var(--on-ink)" }} />
                </span>
                <span>
                  <b>{name}</b>
                  {rest.length ? ` · ${rest.join(" · ")}` : null}
                </span>
              </div>
            );
          })}
        </aside>
      </div>
    );
  }

  return (
    <>
      <header className="ph">
        <div className="ws-ph-stack">
          <h1>Conversations</h1>
          <span className="sub">
            {data.conversations.length} conversations · {data.sharedWithYou} shared with you
          </span>
        </div>
        <Link href="/app/new" className="btn dk">
          <svg
            viewBox="0 0 16 16"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <path d="M8 3v10M3 8h10" />
          </svg>
          New conversation
        </Link>
      </header>
      <div className="ws-page">
        <Suspense fallback={<p className="caption">Loading conversations…</p>}>
          <HistoryFilters data={data} />
        </Suspense>
      </div>
    </>
  );
}
