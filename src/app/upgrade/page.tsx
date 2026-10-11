import type { Metadata } from "next";
import Link from "next/link";
import { getStates } from "../../lib/api";
import { UpgradeForm } from "./UpgradeForm";

export const metadata: Metadata = { title: "Upgrade to Team" };

/* S-08 Upgrade: trial workspace (Sevyn Studios) converting to Team. */
export default function UpgradePage() {
  const { upgrade } = getStates();

  return (
    <main className="center-shell" style={{ alignItems: "flex-start" }}>
      <div className="center-card" style={{ maxWidth: 560 }}>
        <div className="row-between">
          <p className="ui-text">
            <Link href="/" className="wordmark">
              Cortex
            </Link>{" "}
            · {upgrade.workspace}
          </p>
          <Link href="/app/history?state=empty">Back to workspace</Link>
        </div>
        <p className="caption">{upgrade.trialEnds}</p>
        <div className="stack-2">
          <h1 className="page-title" style={{ fontSize: 26 }}>
            {upgrade.heading}
          </h1>
          <p className="ui-text muted-3">{upgrade.body}</p>
        </div>
        <UpgradeForm upgrade={upgrade} />
        <p className="caption">© 2026 [Company] · Privacy · Terms · Security · Status · Help</p>
      </div>
    </main>
  );
}
