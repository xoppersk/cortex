import type { Metadata } from "next";
import Link from "next/link";
import { getStates, getWorkspaceData } from "../../lib/api";
import { UpgradeForm } from "./UpgradeForm";

export const metadata: Metadata = { title: "Upgrade to Team" };

/*
 * S-08 Upgrade. All numbers from the states fixture (seats, per-seat price,
 * monthly limit, charged date, summary sentence). The fixture's chargedDate
 * is "Oct 13"; the summary sentence spells it out as "October 13", which is
 * the "Charged on" line shown here.
 */
export default function UpgradePage() {
  const { upgrade } = getStates();
  const workspace = getWorkspaceData().workspace;

  return (
    <main className="center-shell" style={{ alignItems: "flex-start" }}>
      <div className="center-card" style={{ maxWidth: 560 }}>
        <Link href="/" className="wordmark">
          Cortex
        </Link>
        <div className="stack-2">
          <h1 className="page-title" style={{ fontSize: 26 }}>
            Upgrade {workspace.name} to Team
          </h1>
          <p className="ui-text muted-3">The trial ends {upgrade.chargedDate}. Upgrading keeps every conversation, source and playbook.</p>
        </div>
        <UpgradeForm
          initialSeats={upgrade.seats}
          perSeat={upgrade.perSeat}
          monthlyLimit={upgrade.monthlyLimit}
          chargedDate="October 13"
          workspace={workspace.name}
          summary={upgrade.summary}
        />
      </div>
    </main>
  );
}
