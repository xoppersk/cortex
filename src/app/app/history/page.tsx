import type { Metadata } from "next";
import { Suspense } from "react";
import { LedgerRow } from "../../../components/LedgerRow";
import { getStates } from "../../../lib/api";
import { HistoryFilters } from "./history-filters";

export const metadata: Metadata = { title: "History" };

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;

  if (params.state === "empty") {
    const empty = getStates().emptyHistory;
    return (
      <div className="stack-6">
        <div className="page-head">
          <p className="caption">{empty.workspace}</p>
          <h1 className="page-title">{empty.heading}</h1>
          <p className="summary-sentence">
            This workspace has no conversations yet. Start with one of these, or ask your own question
            of the collections.
          </p>
        </div>
        <div className="ledger" style={{ maxWidth: "var(--column-doc)" }}>
          {empty.starters.map((starter) => (
            <LedgerRow
              key={starter.label}
              href="/app/new"
              title={starter.label}
              description={starter.text}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-head">
        <h1 className="page-title">History</h1>
      </div>
      <Suspense fallback={<p className="caption">Loading conversations…</p>}>
        <HistoryFilters />
      </Suspense>
    </div>
  );
}
