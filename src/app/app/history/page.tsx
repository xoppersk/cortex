import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ButtonLink } from "../../../components/Button";
import { LedgerRow } from "../../../components/LedgerRow";
import { getConversations, getStates } from "../../../lib/api";
import { HistoryFilters } from "./history-filters";

export const metadata: Metadata = { title: "Conversations" };

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;

  if (params.state === "empty") {
    const empty = getStates().emptyHistory;
    return (
      <div className="stack-6" style={{ maxWidth: "var(--column-doc)" }}>
        <div className="page-head">
          <p className="caption">{empty.caption}</p>
          <h1 className="page-title">{empty.heading}</h1>
          <p className="summary-sentence">{empty.body}</p>
        </div>
        <section className="stack-3">
          <p className="ui-text muted-3">Or start from one of these</p>
          <div className="ledger">
            {empty.starters.map((starter) => (
              <LedgerRow key={starter} href="/app/new" title={starter} />
            ))}
          </div>
          <div>
            <ButtonLink href="/app/new" variant="primary" size="md">
              Start a sourced conversation
            </ButtonLink>
          </div>
        </section>
        <section className="stack-3">
          <h2 className="section-label">Ready to cite</h2>
          <div className="ledger">
            {empty.readyToCite.map((item) => (
              <LedgerRow key={item} title={item} />
            ))}
          </div>
        </section>
      </div>
    );
  }

  const data = getConversations();
  return (
    <div>
      <div className="page-head">
        <div className="page-head-row">
          <h1 className="page-title">Conversations</h1>
          <p className="meta">
            {data.conversations.length} conversations · {data.sharedWithYou} shared with you{" "}
            <Link href="/app/new" style={{ marginLeft: 12 }}>
              New conversation
            </Link>
          </p>
        </div>
      </div>
      <Suspense fallback={<p className="caption">Loading conversations…</p>}>
        <HistoryFilters />
      </Suspense>
    </div>
  );
}
