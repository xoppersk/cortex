"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { Button, ButtonLink } from "../../../components/Button";
import { LedgerRow } from "../../../components/LedgerRow";
import { getPlaybooks } from "../../../lib/api";
import type { PlaybookRow } from "../../../lib/types";
import { formatCost } from "../../../lib/utils";

type TabId = "team" | "private" | "archived";

export function withDottedInputs(instructions: string): ReactNode {
  const parts = instructions.split(/(\[[^\]]+\])/g);
  return (
    <>
      {parts.map((part, index) =>
        part.startsWith("[") && part.endsWith("]") ? (
          <span key={index} className="dotted-input">
            {part.slice(1, -1)}
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
      description={playbook.description}
      value={playbook.status}
      meta={
        playbook.owner
          ? `${playbook.owner} · ${playbook.runs} runs · ${playbook.updated}`
          : `${playbook.runs} runs · ${playbook.status ?? playbook.updated}`
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
    { id: "team", label: `Team · ${playbooks.team.length + 1}` },
    { id: "private", label: `Private · ${playbooks.private.length}` },
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
      <div className="row-between">
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
        <button type="button" className="filter-button">
          Most used
        </button>
      </div>

      {tab === "team" ? (
        <div role="tabpanel" id="panel-team" aria-labelledby="tab-team" className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Playbook</th>
                <th scope="col">Owner</th>
                <th scope="col" className="numeric">
                  Runs, 30 days
                </th>
                <th scope="col">Edited</th>
              </tr>
            </thead>
            <tbody>
              <tr className="featured-row">
                <td>
                  <span className="ui-strong">{featured.name}</span>
                  <br />
                  <span className="muted-3">{featured.description}</span>
                </td>
                <td>{featured.owner}</td>
                <td className="numeric">{featured.runs}</td>
                <td>{featured.updated}</td>
              </tr>
              <tr>
                <td colSpan={4}>
                  <div className="stack-4" style={{ maxWidth: "var(--column-doc)", padding: "var(--space-4) 0" }}>
                    <p className="caption" style={{ fontWeight: 600, color: "var(--ink)" }}>
                      Instructions
                    </p>
                    <p className="answer-text" style={{ fontSize: 16 }}>
                      {withDottedInputs(playbooks.edit.instructions)}
                    </p>
                    <dl className="definition-grid">
                      <dt>Inputs</dt>
                      <dd>{featured.inputs}</dd>
                      <dt>Sources</dt>
                      <dd>{featured.sources}</dd>
                      <dt>Checks</dt>
                      <dd>{featured.checks}</dd>
                      <dt>Avg. cost</dt>
                      <dd>{formatCost(featured.avgCost ?? 0)} per run</dd>
                      <dt>Pass rate</dt>
                      <dd>{featured.passRate}</dd>
                    </dl>
                    <div className="row">
                      <Button variant="primary" size="md">
                        Run playbook
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
                  </div>
                </td>
              </tr>
              {playbooks.team.map((playbook) => (
                <tr key={playbook.id}>
                  <td>
                    <span className="ui-strong">{playbook.name}</span>
                    <br />
                    <span className="muted-3">{playbook.description}</span>
                  </td>
                  <td>{playbook.owner}</td>
                  <td className="numeric">{playbook.runs}</td>
                  <td>{playbook.updated}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
