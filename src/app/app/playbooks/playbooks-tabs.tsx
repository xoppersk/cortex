"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { Button, ButtonLink } from "../../../components/Button";
import { LedgerRow } from "../../../components/LedgerRow";
import { getPlaybooks } from "../../../lib/api";
import type { PlaybookRow } from "../../../lib/types";
import { formatCost } from "../../../lib/utils";

type TabId = "team" | "private" | "archived";

function withDottedInputs(instructions: string): ReactNode {
  const parts = instructions.split(/(\[[^\]]+\])/g);
  return (
    <>
      {parts.map((part, index) =>
        part.startsWith("[") && part.endsWith("]") ? (
          <span key={index} className="dotted-input">
            {part}
          </span>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </>
  );
}

function PlaybookLedgerRow({ playbook }: { playbook: PlaybookRow }) {
  return (
    <LedgerRow
      title={playbook.name}
      description={playbook.passRate}
      value={playbook.avgCost ? `${formatCost(playbook.avgCost)} avg` : playbook.status}
      meta={
        playbook.owner
          ? `${playbook.owner} · ${playbook.runs} runs · Updated ${playbook.updated}`
          : `${playbook.runs} runs · ${playbook.status ?? `Updated ${playbook.updated}`}`
      }
    />
  );
}

export function PlaybooksTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const playbooks = getPlaybooks();
  const featured = playbooks.featured;

  const tab = (searchParams.get("tab") as TabId | null) ?? "team";

  const tabs: Array<{ id: TabId; label: string }> = [
    { id: "team", label: `Team ${playbooks.team.length + 1}` },
    { id: "private", label: `Private ${playbooks.private.length}` },
    { id: "archived", label: "Archived" },
  ];

  function selectTab(next: TabId) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "team") params.delete("tab");
    else params.set("tab", next);
    const query = params.toString();
    router.replace(query ? `/app/playbooks?${query}` : "/app/playbooks", { scroll: false });
  }

  return (
    <div className="stack-5">
      <div className="tabs" role="tablist" aria-label="Playbooks">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`tab-${item.id}`}
            aria-selected={tab === item.id}
            aria-controls={`panel-${item.id}`}
            className="tab-button"
            onClick={() => selectTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "team" ? (
        <div role="tabpanel" id="panel-team" aria-labelledby="tab-team" className="stack-5">
          <article
            className="stack-4"
            style={{ borderTop: "1px solid var(--ink)", paddingTop: "var(--space-5)", maxWidth: "var(--column-doc)" }}
          >
            <div className="row-between">
              <h2 className="section-label" style={{ fontSize: 15 }}>
                {featured.name}
              </h2>
              <span className="caption">
                {featured.owner} · Updated {featured.updated}
              </span>
            </div>
            <p className="answer-text" style={{ fontSize: 16 }}>
              {withDottedInputs(featured.instructions)}
            </p>
            <dl className="definition-grid">
              <dt>Inputs</dt>
              <dd>{featured.inputs}</dd>
              <dt>Sources</dt>
              <dd>{featured.sources}</dd>
              <dt>Checks</dt>
              <dd>{featured.checks}</dd>
              <dt>Avg cost</dt>
              <dd>{formatCost(featured.avgCost ?? 0)} per run</dd>
              <dt>Pass rate</dt>
              <dd>{featured.passRate}</dd>
            </dl>
            <div className="row">
              <Button variant="primary" size="md">
                Run
              </Button>
              <ButtonLink href={`/app/playbooks/${featured.id}/edit`} variant="secondary" size="md">
                Edit
              </ButtonLink>
              <Button variant="quiet" size="md">
                Duplicate
              </Button>
              <Button variant="quiet" size="md">
                View runs
              </Button>
            </div>
          </article>

          <div className="ledger">
            {playbooks.team.map((playbook) => (
              <PlaybookLedgerRow key={playbook.id} playbook={playbook} />
            ))}
          </div>
        </div>
      ) : null}

      {tab === "private" ? (
        <div role="tabpanel" id="panel-private" aria-labelledby="tab-private">
          <div className="ledger">
            {playbooks.private.map((playbook) => (
              <PlaybookLedgerRow key={playbook.id} playbook={playbook} />
            ))}
          </div>
        </div>
      ) : null}

      {tab === "archived" ? (
        <div role="tabpanel" id="panel-archived" aria-labelledby="tab-archived">
          <div className="ledger">
            {playbooks.archived.map((playbook) => (
              <PlaybookLedgerRow key={playbook.id} playbook={playbook} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
