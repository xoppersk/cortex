import type { Metadata } from "next";
import { Suspense } from "react";
import { ButtonLink } from "../../../components/Button";
import { PlaybooksTabs } from "./playbooks-tabs";

export const metadata: Metadata = { title: "Playbooks" };

export default function PlaybooksPage() {
  return (
    <div>
      <div className="page-head">
        <div className="page-head-row">
          <h1 className="page-title">Playbooks</h1>
          <ButtonLink href="/app/playbooks/launch-brief/edit" variant="primary" size="md">
            New playbook
          </ButtonLink>
        </div>
        <p className="summary-sentence">
          Prompts that worked once, saved so the team can run them again with their own inputs.
        </p>
      </div>
      <Suspense fallback={<p className="caption">Loading playbooks…</p>}>
        <PlaybooksTabs />
      </Suspense>
    </div>
  );
}
