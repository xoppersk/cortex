"use client";

import { useState } from "react";
import { Button } from "../../components/Button";
import { LedgerRow } from "../../components/LedgerRow";
import type { StatesData } from "../../lib/types";

type Upgrade = StatesData["upgrade"];

export function UpgradeForm({ upgrade }: { upgrade: Upgrade }) {
  const [seats, setSeats] = useState(upgrade.seatsInTrial);
  const [limit, setLimit] = useState(upgrade.limitValue);
  const [done, setDone] = useState(false);

  const seatsTotal = seats * upgrade.perSeat;
  const money = (value: number) => `$${value.toFixed(2)}`;

  if (done) {
    return (
      <p className="ui-text" role="status">
        Team starts on {upgrade.chargedDate}. {upgrade.workspace} keeps answering until then on the
        trial.
      </p>
    );
  }

  return (
    <div className="stack-6">
      <div className="stack-3">
        <span className="settings-grid-label" id="seats-label" style={{ paddingTop: 0 }}>
          Seats
        </span>
        <p className="caption">
          {upgrade.seatsInTrial} people are in the trial. Viewers are free.
        </p>
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
          <button type="button" aria-label="Add a seat" onClick={() => setSeats((value) => value + 1)}>
            +
          </button>
        </div>
      </div>

      <div className="stack-3">
        <label className="settings-grid-label" htmlFor="upgrade-limit" style={{ paddingTop: 0 }}>
          Monthly spending limit
        </label>
        <p className="caption">{upgrade.usageNote}</p>
        <input
          id="upgrade-limit"
          className="field-control"
          style={{ maxWidth: 160 }}
          value={limit}
          onChange={(event) => setLimit(event.target.value)}
        />
      </div>

      <div className="stack-3">
        <span className="settings-grid-label" style={{ paddingTop: 0 }}>
          Payment
        </span>
        <div className="row">
          <Button variant="secondary" size="md">
            Add a card
          </Button>
          <span className="ui-text muted-3">Or pay annually by invoice.</span>
        </div>
      </div>

      <section className="stack-3" aria-labelledby="upgrade-plan-heading">
        <h2 className="section-label" id="upgrade-plan-heading" style={{ fontSize: 15 }}>
          Team plan
        </h2>
        <div className="ledger">
          <LedgerRow
            title={`${seats} seats × $${upgrade.perSeat}`}
            value={money(seatsTotal)}
          />
          <LedgerRow title="Model use at cost" description={upgrade.modelUseNote} value={`up to ${limit}`} />
          <LedgerRow featured title={`Charged ${upgrade.chargedDate}`} value={money(seatsTotal)} />
        </div>
        <p className="caption">{upgrade.footerNote}</p>
        <div>
          <Button variant="primary" size="lg" onClick={() => setDone(true)}>
            Start Team on {upgrade.chargedDate}
          </Button>
        </div>
      </section>
    </div>
  );
}
