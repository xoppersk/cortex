"use client";

import { useState } from "react";
import { Button } from "../../components/Button";
import { formatMoney } from "../../lib/utils";

/*
 * S-08 upgrade controls: seats stepper and monthly-limit segmented control.
 * The summary math (seats × per-seat price) updates live from the fixture
 * values passed in by the server page.
 */
export function UpgradeForm({
  initialSeats,
  perSeat,
  monthlyLimit,
  chargedDate,
  workspace,
  summary,
}: {
  initialSeats: number;
  perSeat: number;
  monthlyLimit: number;
  chargedDate: string;
  workspace: string;
  summary: string;
}) {
  const [seats, setSeats] = useState(initialSeats);
  const [limit, setLimit] = useState(monthlyLimit);
  const [done, setDone] = useState(false);

  const limitOptions = [200, 250, 500];
  const seatsTotal = seats * perSeat;
  const liveSummary = `${seats} seats at ${formatMoney(perSeat)} is ${formatMoney(seatsTotal)}, charged ${chargedDate}. Model use is billed at cost up to the ${formatMoney(limit)} monthly limit.`;

  return (
    <div className="stack-6">
      <div className="stack-3">
        <span className="settings-grid-label" id="seats-label" style={{ paddingTop: 0 }}>
          Seats
        </span>
        <div className="stepper" role="group" aria-labelledby="seats-label">
          <button
            type="button"
            aria-label="Remove a seat"
            onClick={() => setSeats((value) => Math.max(1, value - 1))}
            disabled={seats <= 1}
          >
            −
          </button>
          <span className="stepper-value" aria-live="polite">
            {seats}
          </span>
          <button
            type="button"
            aria-label="Add a seat"
            onClick={() => setSeats((value) => value + 1)}
          >
            +
          </button>
          <span className="ui-text muted-3">
            {formatMoney(perSeat)} per seat a month
          </span>
        </div>
      </div>

      <div className="stack-3">
        <span className="settings-grid-label" id="limit-label" style={{ paddingTop: 0 }}>
          Monthly limit
        </span>
        <div className="segmented" role="group" aria-labelledby="limit-label">
          {limitOptions.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={limit === option}
              onClick={() => setLimit(option)}
            >
              {formatMoney(option)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Button variant="secondary" size="md">
          Add a card
        </Button>
      </div>

      <div
        className="stack-3"
        style={{
          borderTop: "1px solid var(--ink)",
          paddingTop: 20,
        }}
      >
        <dl className="definition-grid" style={{ gridTemplateColumns: "minmax(0, 1fr) auto" }}>
          <dt style={{ color: "var(--ink-2)" }}>
            Seats {seats} × {formatMoney(perSeat)}
          </dt>
          <dd style={{ textAlign: "right", fontWeight: 500, color: "var(--ink)" }}>
            {formatMoney(seatsTotal)}
          </dd>
          <dt style={{ color: "var(--ink-2)" }}>
            Model use at cost, up to the {formatMoney(limit)} monthly limit
          </dt>
          <dd style={{ textAlign: "right" }}>At cost</dd>
        </dl>
        <p className="ui-text muted-3">Charged on {chargedDate}</p>
        <p className="summary-sentence" style={{ fontSize: 16 }}>
          {seats === initialSeats && limit === monthlyLimit ? summary : liveSummary}
        </p>
        {done ? (
          <p className="ui-text" role="status" style={{ fontSize: 14 }}>
            {workspace} is on Team. The first charge lands on {chargedDate}.
          </p>
        ) : (
          <div>
            <Button variant="primary" size="lg" onClick={() => setDone(true)}>
              Upgrade
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
