"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "../../../components/Button";
import { getAdminData } from "../../../lib/api";
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

  return (
    <>
      <header className="page-head">
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "var(--space-4)", flexWrap: "wrap" }}>
          <div style={{ maxWidth: 620 }}>
            <h1 className="page-title">API keys</h1>
            <p className="summary-sentence" style={{ marginTop: "var(--space-3)" }}>
              {apiKeys.summary}
            </p>
          </div>
          <Button variant="primary" onClick={createKey} style={{ minHeight: 32 }}>
            Create key
          </Button>
        </div>
      </header>

      <div className="stack-6">
        {reveal ? <RevealPanel reveal={reveal} onStored={() => setReveal(null)} /> : null}

        <section aria-label="All keys">
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Key</th>
                  <th scope="col">Access</th>
                  <th scope="col">Last used</th>
                  <th scope="col">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <span className="ui-strong" style={{ fontSize: 13 }}>
                        {row.name}
                      </span>
                      <br />
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 12,
                          lineHeight: 1.4,
                          color: "var(--ink-2)",
                        }}
                      >
                        {row.masked} · {row.createdNote}
                      </span>
                    </td>
                    <td>
                      {row.flag ? (
                        <span style={{ color: "var(--warn)", fontWeight: 500 }}>{row.access}</span>
                      ) : (
                        row.access
                      )}
                      {row.flag ? (
                        <>
                          <br />
                          <span style={{ fontSize: 12, color: "var(--ink-3)" }}>{row.flag}</span>
                        </>
                      ) : null}
                    </td>
                    <td>
                      {row.lastUsed}
                      {row.cost ? (
                        <>
                          <br />
                          <span className="meta-ink4">${row.cost} this cycle</span>
                        </>
                      ) : null}
                      {row.expiresNote ? (
                        <>
                          <br />
                          <span style={{ fontSize: 12, color: "var(--warn)" }}>{row.expiresNote}</span>
                        </>
                      ) : null}
                    </td>
                    <td>
                      <Button variant="quiet" size="sm" style={{ minHeight: 26, padding: "0 6px" }} onClick={() => revoke(row.id)}>
                        Revoke
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: 12, lineHeight: 1.45, color: "var(--ink-3)", marginTop: "var(--space-4)" }}>
            {apiKeys.footerSegments.map((segment, index) =>
              "href" in segment && segment.href ? (
                <Link key={index} href={segment.href} style={{ color: "var(--ink-2)" }}>
                  {segment.text}
                </Link>
              ) : (
                <span key={index}>{segment.text}</span>
              ),
            )}
          </p>
        </section>
      </div>
    </>
  );
}
