import type { Metadata } from "next";
import { Suspense } from "react";
import { ButtonLink } from "../../../components/Button";
import { Icon } from "../../../components/Icon";
import { PlaybooksTabs } from "./playbooks-tabs";

export const metadata: Metadata = { title: { absolute: "Cortex — Playbooks" } };

export default function PlaybooksPage() {
  return (
    <>
      <header className="pv-ph" style={{ alignItems: "flex-end" }}>
        <div className="pv-ph-title" style={{ gap: 8, maxWidth: 620 }}>
          <h1>Playbooks</h1>
          <p style={{ margin: 0, font: "400 16px/1.55 var(--font-serif)", color: "var(--ink-2)" }}>
            Prompts that worked once, saved so the team can run them again with their own inputs.
          </p>
        </div>
        <ButtonLink href="/app/playbooks/launch-brief/edit" variant="primary">
          <Icon name="plus" strokeWidth={1.8} style={{ color: "currentColor" }} />
          New playbook
        </ButtonLink>
      </header>
      <Suspense fallback={<p className="pv-body caption">Loading playbooks…</p>}>
        <PlaybooksTabs />
      </Suspense>
    </>
  );
}
