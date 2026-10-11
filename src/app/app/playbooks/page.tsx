import type { Metadata } from "next";
import { Suspense } from "react";
import { PlaybooksTabs } from "./playbooks-tabs";

export const metadata: Metadata = { title: "Playbooks" };

export default function PlaybooksPage() {
  return (
    <div>
      <div className="page-head">
        <h1 className="page-title">Playbooks</h1>
        <p className="summary-sentence">
          Prompts the team has agreed are worth keeping, with the sources and checks each run has to
          pass.
        </p>
      </div>
      <Suspense fallback={<p className="caption">Loading playbooks…</p>}>
        <PlaybooksTabs />
      </Suspense>
    </div>
  );
}
