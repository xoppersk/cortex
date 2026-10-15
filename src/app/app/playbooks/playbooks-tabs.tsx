"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";
import { Button, ButtonLink } from "../../../components/Button";
import { Icon } from "../../../components/Icon";
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
          <span key={index} className="pv-var">
            {part.slice(1, -1)}
          </span>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </>
  );
}

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function ownerTone(name: string) {
  if (name === "Sheku Koroma") return "pv-av-ink";
  if (name.startsWith("Maya")) return "pv-av-1";
  if (name.startsWith("Owen")) return "pv-av-2";
  return "pv-av-3";
}

function Owner({ name }: { name?: string }) {
  if (!name) return <span role="cell" />;
  return (
    <span role="cell" className="pv-ppl">
      <span className={`pv-av pv-av-sm ${ownerTone(name)}`} aria-hidden="true" style={{ border: 0 }}>
        {initialsOf(name)}
      </span>
      {name}
    </span>
  );
}

function PlaybookListRow({ playbook }: { playbook: PlaybookRow }) {
  const archived = Boolean(playbook.status);
  return (
    <Link role="row" href={archived ? "/app/playbooks?tab=archived" : `/app/playbooks/${playbook.id}/edit`} className="pv-row pv-pb-row pv-stack">
      <span role="cell" style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
        <b style={{ fontSize: 14, fontWeight: 600 }}>{playbook.name}</b>
        {playbook.description ? <span className="pv-pb-desc">{playbook.description}</span> : null}
      </span>
      {archived ? (
        <span role="cell" style={{ fontSize: 12.5, color: "var(--ink-3)" }}>
          {playbook.status}
        </span>
      ) : (
        <Owner name={playbook.owner} />
      )}
      <span role="cell" className="pv-mono" style={{ textAlign: "right" }}>
        <span className="pv-row-cell-label">Runs, 30 days</span>
        {playbook.runs}
      </span>
      <span role="cell" className="pv-mono" style={{ textAlign: "right", color: "var(--ink-3)", fontSize: 12 }}>
        <span className="pv-row-cell-label">Edited</span>
        {playbook.updated}
      </span>
    </Link>
  );
}

function ListHead({ first }: { first: string }) {
  return (
    <div role="row" className="pv-row pv-pb-row pv-th pv-stack pv-row-head" style={{ background: "transparent", paddingTop: 12, paddingBottom: 12 }}>
      <span role="columnheader">{first}</span>
      <span role="columnheader">Owner</span>
      <span role="columnheader" style={{ textAlign: "right" }}>
        Runs, 30 days
      </span>
      <span role="columnheader" style={{ textAlign: "right" }}>
        Edited
      </span>
    </div>
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

  const passMatch = /(\d+) of (\d+)/.exec(featured.passRate);
  const passPercent = passMatch ? (Number(passMatch[1]) / Number(passMatch[2])) * 100 : 0;

  return (
    <div className="pv-body" style={{ paddingTop: 24, gap: 18 }}>
      <div className="pv-toolbar">
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
        <Button variant="secondary">
          <Icon name="sort" style={{ color: "var(--ink-2)" }} />
          Most used
        </Button>
      </div>

      {tab === "team" ? (
        <div role="tabpanel" id="panel-team" aria-labelledby="tab-team">
          <div role="table" aria-label="Team playbooks" className="pv-card pv-rows" style={{ overflow: "hidden" }}>
            <ListHead first="Playbook" />
            <div role="row" className="pv-pb-featured">
              <div className="pv-pb-row pv-pb-featured-head pv-stack">
                <span role="cell" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <b style={{ font: "600 22px/1.15 var(--font-serif)", letterSpacing: "-0.015em" }}>{featured.name}</b>
                  <span style={{ font: "400 15px/1.45 var(--font-serif)", color: "var(--ink-3)" }}>{featured.description}</span>
                </span>
                <Owner name={featured.owner} />
                <span role="cell" className="pv-mono" style={{ textAlign: "right", fontSize: 15, fontWeight: 500 }}>
                  <span className="pv-row-cell-label">Runs, 30 days</span>
                  {featured.runs}
                </span>
                <span role="cell" className="pv-mono" style={{ textAlign: "right", color: "var(--ink-3)", fontSize: 12 }}>
                  <span className="pv-row-cell-label">Edited</span>
                  {featured.updated}
                </span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
                <figure className="pv-instructions">
                  <figcaption className="pv-lbl">Instructions</figcaption>
                  <p>{withDottedInputs(featured.instructions)}</p>
                </figure>
                <dl className="pv-dl pv-pb-meta">
                  <dt>Inputs</dt>
                  <dd>{featured.inputs}</dd>
                  <dt>Sources</dt>
                  <dd>{featured.sources}</dd>
                  <dt>Checks</dt>
                  <dd>{featured.checks}</dd>
                  <dt>Avg. cost</dt>
                  <dd>
                    <span className="pv-mono">{formatCost(featured.avgCost ?? 0)}</span> per run
                  </dd>
                  <dt>Pass rate</dt>
                  <dd style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {featured.passRate}
                    <span className="pv-bar" aria-hidden="true">
                      <i style={{ width: `${passPercent}%` }} />
                    </span>
                  </dd>
                </dl>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                <ButtonLink href="/app/new" variant="primary">
                  <Icon name="play" style={{ color: "currentColor", width: 12, height: 12 }} />
                  Run playbook
                </ButtonLink>
                <ButtonLink href={`/app/playbooks/${featured.id}/edit`} variant="secondary">
                  Edit
                </ButtonLink>
                <Button variant="quiet">Duplicate</Button>
                <Button variant="quiet">View runs</Button>
              </div>
            </div>
            {playbooks.team.map((playbook) => (
              <PlaybookListRow key={playbook.id} playbook={playbook} />
            ))}
          </div>
        </div>
      ) : null}

      {tab === "private" ? (
        <div role="tabpanel" id="panel-private" aria-labelledby="tab-private">
          <div role="table" aria-label="Private playbooks" className="pv-card pv-rows" style={{ overflow: "hidden" }}>
            <ListHead first="Playbook" />
            {playbooks.private.map((playbook) => (
              <PlaybookListRow key={playbook.id} playbook={playbook} />
            ))}
          </div>
        </div>
      ) : null}

      {tab === "archived" ? (
        <div role="tabpanel" id="panel-archived" aria-labelledby="tab-archived">
          <div role="table" aria-label="Archived playbooks" className="pv-card pv-rows" style={{ overflow: "hidden" }}>
            <ListHead first="Playbook" />
            {playbooks.archived.map((playbook) => (
              <PlaybookListRow key={playbook.id} playbook={playbook} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
