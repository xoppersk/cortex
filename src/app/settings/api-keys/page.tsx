"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "../../../components/Button";
import { Icon } from "../../../components/Icon";
import { SettingsHeader } from "../../../components/Shells";
import { getAdminData } from "../../../lib/api";
import { cx } from "../../../lib/utils";
import { RevealPanel, type RevealView } from "./RevealPanel";

interface KeyRow {
  id: string;
  name: string;
  masked: string;
  createdNote: string;
  access: string;
  flag?: string;
  lastUsed: string;
  expiresNote?: string;
  cost: number | null;
}

const KEY_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz123456789";

function generateKeyMaterial(seed: number): { full: string; masked: string } {
  let state = seed;
  const next = () => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return KEY_CHARS[state % KEY_CHARS.length]!;
  };
  const head = Array.from({ length: 4 }, next).join("");
  const tail = Array.from({ length: 4 }, next).join("");
  const middle = Array.from({ length: 29 }, next).join("").replace(/./g, "·");
  return { full: `cx_live_${head}${middle}${tail}`, masked: `cx_live_${head}…${tail}` };
}

export default function ApiKeysPage() {
  const { apiKeys } = getAdminData();
  const [rows, setRows] = useState<KeyRow[]>(
    apiKeys.rows.map((row) => ({
      id: row.id,
      name: row.name,
      masked: row.masked,
      createdNote: row.createdNote,
      access: row.access,
      flag: "flag" in row ? row.flag : undefined,
      lastUsed: row.lastUsed,
      expiresNote: "expiresNote" in row ? row.expiresNote : undefined,
      cost: row.cost,
    })),
  );
  const [reveal, setReveal] = useState<RevealView | null>({
    heading: apiKeys.reveal.heading,
    body: apiKeys.reveal.body,
    label: apiKeys.reveal.label,
    key: apiKeys.reveal.key,
    can: apiKeys.reveal.can,
    cannot: apiKeys.reveal.cannot,
    expires: apiKeys.reveal.expires,
  });
  const [createdCount, setCreatedCount] = useState(0);

  function createKey() {
    const n = createdCount + 1;
    setCreatedCount(n);
    const material = generateKeyMaterial(Date.now() + n * 7919);
    const name = n === 1 ? "New key" : `New key ${n}`;
    setReveal({
      heading: `“${name}” is ready. Copy it now.`,
      body: apiKeys.reveal.body,
      label: apiKeys.reveal.label,
      key: material.full,
      can: apiKeys.reveal.can,
      cannot: apiKeys.reveal.cannot,
      expires: apiKeys.reveal.expires,
    });
    setRows((previous) => [
      {
        id: `new-key-${n}`,
        name,
        masked: material.masked,
        createdNote: "created just now by you",
        access: "Ask, read sources",
        lastUsed: "Never",
        cost: null,
      },
      ...previous,
    ]);
  }

  function revoke(id: string) {
    setRows((previous) => previous.filter((row) => row.id !== id));
  }

  const newestId = rows[0]?.id;

  return (
    <>
      <SettingsHeader
        title="API keys"
        lede={apiKeys.summary}
        actions={
          <Button variant="primary" onClick={createKey}>
            <Icon name="plus" size={14} strokeWidth={1.8} style={{ color: "currentColor" }} />
            Create key
          </Button>
        }
      />

      <div className="pv-set-form" style={{ gap: 18, maxWidth: 1176 }}>
        {reveal ? <RevealPanel reveal={reveal} onStored={() => setReveal(null)} /> : null}

        <div className="pv-card" style={{ overflow: "hidden" }}>
          <div role="table" aria-label="All keys" className="pv-rows">
            <div role="row" className="pv-row pv-row-head pv-keyr pv-th pv-stack">
              <span role="columnheader">Key</span>
              <span role="columnheader">Access</span>
              <span role="columnheader">Last used</span>
              <span role="columnheader">
                <span className="sr-only">Actions</span>
              </span>
            </div>
            {rows.map((row) => {
              const fresh = reveal !== null && row.id === newestId && row.lastUsed === "Never";
              return (
                <div role="row" key={row.id} className={cx("pv-row pv-keyr pv-stack", fresh && "pv-keyr-new")}>
                  <span role="cell" className="pv-ki">
                    <span className={cx("pv-ib", fresh && "pv-ib-hl", row.flag && "pv-ib-ln")} aria-hidden="true">
                      <Icon name="key" style={row.flag ? { color: "var(--ink-4)" } : undefined} />
                    </span>
                    <span className="pv-ki-text">
                      <b>{row.name}</b>
                      <code>
                        {row.masked} · {row.createdNote}
                      </code>
                    </span>
                  </span>
                  <span role="cell" className="pv-cell-stack">
                    <span className={cx("pv-tag", row.flag && "pv-tag-warn")}>{row.access}</span>
                    {row.flag ? <span className="pv-cell-sub">{row.flag}</span> : null}
                  </span>
                  <span role="cell" className="pv-cell-stack" style={{ color: row.lastUsed === "Never" ? "var(--ink-3)" : "var(--ink)" }}>
                    <span className="pv-row-cell-label">Last used</span>
                    {row.lastUsed}
                    {row.cost ? <span className="pv-mono pv-cell-sub" style={{ color: "var(--ink-4)" }}>${row.cost} this cycle</span> : null}
                    {row.expiresNote ? <span className="pv-cell-sub" style={{ color: "var(--warn)" }}>{row.expiresNote}</span> : null}
                  </span>
                  <span role="cell" className="pv-row-actions">
                    <Button variant="quiet" size="sm" onClick={() => revoke(row.id)} aria-label={`Revoke ${row.name}`}>
                      Revoke
                    </Button>
                  </span>
                </div>
              );
            })}
          </div>
          <p className="pv-foot-note">
            {apiKeys.footerSegments.map((segment, index) =>
              "href" in segment && segment.href ? (
                <Link key={index} href={segment.href}>
                  {segment.text}
                </Link>
              ) : (
                <span key={index}>{segment.text}</span>
              ),
            )}
          </p>
        </div>
      </div>
    </>
  );
}
