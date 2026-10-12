"use client";

import { useState } from "react";

export function UsageActions({
  actions,
}: {
  actions: Array<{ label: string; description: string }>;
}) {
  const [chosen, setChosen] = useState<string | null>(null);

  return (
    <ul className="stack-3" style={{ listStyle: "none", padding: 0, margin: 0 }}>
      {actions.map((action) => {
        const active = chosen === action.label;
        return (
          <li key={action.label}>
            <button
              type="button"
              className="act-card"
              aria-pressed={active}
              onClick={() => setChosen(active ? null : action.label)}
              style={active ? { borderColor: "var(--ink)" } : undefined}
            >
              <span className="act-label">{action.label}</span>
              <span className="act-detail">{action.description}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
