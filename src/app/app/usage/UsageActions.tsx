"use client";

import { useState } from "react";

export function UsageActions({
  actions,
}: {
  actions: Array<{ label: string; description: string }>;
}) {
  const [chosen, setChosen] = useState<string | null>(null);

  return (
    <ul className="ws-act-list">
      {actions.map((action) => {
        const active = chosen === action.label;
        return (
          <li key={action.label}>
            <button
              type="button"
              className="ws-act"
              aria-pressed={active}
              onClick={() => setChosen(active ? null : action.label)}
            >
              {action.label}
              <span>{action.description}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
