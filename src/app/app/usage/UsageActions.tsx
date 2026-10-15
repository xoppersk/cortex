"use client";

import { useState } from "react";

export function UsageActions({
  actions,
}: {
  actions: Array<{ label: string; description: string }>;
}) {
  const [chosen, setChosen] = useState<string | null>(null);

  return (
    <>
      {actions.map((action, index) => {
        const active = chosen === action.label;
        const isLast = index === actions.length - 1;
        return (
          <button
            key={action.label}
            type="button"
            className="pv-act pv-act-stack"
            aria-pressed={active}
            onClick={() => setChosen(active ? null : action.label)}
            style={{
              ...(isLast ? { background: "var(--paper-sunk)" } : null),
              ...(active ? { boxShadow: "var(--shadow-hover)" } : null),
            }}
          >
            {action.label}
            <span className="pv-act-sub">{action.description}</span>
          </button>
        );
      })}
    </>
  );
}
