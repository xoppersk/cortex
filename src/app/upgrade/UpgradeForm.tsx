"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Button } from "../../components/Button";
import { fieldDescribedBy } from "../../components/Field";
import { Icon } from "../../components/Icon";
import type { StatesData } from "../../lib/types";

type Upgrade = StatesData["upgrade"];

/*
 * Upgrade (Premium v2): a white form sheet beside a lifted summary sheet.
 * Sections open with a hairline and keep label/helper left, control right.
 * "Add a card" opens the card step (number / expiry / CVC); "Start
 * Team" is gated on a card on file and a valid limit. The summary's
 * model-use line is derived from the limit so the two never desync.
 * On completion the flow returns to the workspace (the empty-history
 * trial home, the same target as "Back to workspace"); the design ships
 * no post-submit state.
 */

function parseLimit(raw: string): number | null {
  const value = Number.parseFloat(raw.replace(/[^0-9.]/g, ""));
  return Number.isFinite(value) && value > 0 ? value : null;
}

function formatLimit(value: number): string {
  return `$${Number.isInteger(value) ? value : value.toFixed(2)}`;
}

export function UpgradeForm({ upgrade }: { upgrade: Upgrade }) {
  const router = useRouter();
  const [seats, setSeats] = useState(upgrade.seatsInTrial);
  const [limit, setLimit] = useState(upgrade.limitValue);
  const [submitted, setSubmitted] = useState(false);

  const [showCard, setShowCard] = useState(false);
  const [cardAdded, setCardAdded] = useState(false);
  const [cardLast4, setCardLast4] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [cardSubmitted, setCardSubmitted] = useState(false);

  const seatsTotal = seats * upgrade.perSeat;
  const money = (value: number) => `$${value.toFixed(2)}`;

  const limitValue = parseLimit(limit);
  const limitLabel = limitValue !== null ? formatLimit(limitValue) : limit;
  const limitError =
    submitted && limitValue === null ? "Enter a limit above $0, like $75." : undefined;
  const paymentError =
    submitted && !cardAdded ? "Add a card before starting Team." : undefined;

  const cardDigits = cardNumber.replace(/\D/g, "");
  const cardNumberError =
    cardSubmitted && (cardDigits.length < 12 || cardDigits.length > 19)
      ? "Enter the full card number."
      : undefined;
  const cardExpiryError =
    cardSubmitted && !/^(0[1-9]|1[0-2])\/\d{2}$/.test(cardExpiry.trim())
      ? "Use MM/YY."
      : undefined;
  const cardCvcError =
    cardSubmitted && !/^\d{3,4}$/.test(cardCvc.trim()) ? "Enter the 3 or 4 digit code." : undefined;

  function onSaveCard() {
    setCardSubmitted(true);
    const numberOk = cardDigits.length >= 12 && cardDigits.length <= 19;
    const expiryOk = /^(0[1-9]|1[0-2])\/\d{2}$/.test(cardExpiry.trim());
    const cvcOk = /^\d{3,4}$/.test(cardCvc.trim());
    if (numberOk && expiryOk && cvcOk) {
      setCardAdded(true);
      setCardLast4(cardDigits.slice(-4));
      setShowCard(false);
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    if (!cardAdded) {
      setShowCard(true);
      return;
    }
    if (limitValue === null) return;
    router.push("/app/history?state=empty");
  }

  return (
    <>
      <form id="upgrade-form" onSubmit={onSubmit} noValidate className="pm-sheet pm-upgrade">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <span style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
            <span className="pv-tag pv-tag-ln" style={{ height: 22, fontSize: 12 }}>
              {upgrade.workspace}
            </span>
            <span className="pm-trial-ends">
              <Icon name="clock" size={14} style={{ color: "var(--warn)" }} />
              {upgrade.trialEnds}
            </span>
          </span>
          <h1>{upgrade.heading}</h1>
          <p className="pm-upgrade-body">{upgrade.body}</p>
        </div>

        <div className="pm-set">
          <div className="pm-set-text">
            <span id="seats-label" className="pm-set-label">
              Seats
            </span>
            <span>{upgrade.seatsInTrial} people are in the trial. Viewers are free.</span>
          </div>
          <div role="group" aria-labelledby="seats-label" className="pm-stepper">
            <button type="button" className="pm-stp" aria-label="Remove a seat" onClick={() => setSeats((value) => Math.max(1, value - 1))} disabled={seats <= 1}>
              −
            </button>
            <span aria-live="polite" aria-label={`${seats} seats`}>
              {seats}
            </span>
            <button type="button" className="pm-stp" aria-label="Add a seat" onClick={() => setSeats((value) => value + 1)}>
              +
            </button>
          </div>
        </div>

        <div className="pm-set">
          <div className="pm-set-text" style={{ maxWidth: 380 }}>
            <label htmlFor="upgrade-limit" className="pm-set-label">
              Monthly spending limit
            </label>
            <span>{upgrade.usageNote}</span>
            {limitError ? (
              <span role="alert" id="upgrade-limit-error" style={{ color: "var(--danger)" }}>
                {limitError}
              </span>
            ) : null}
          </div>
          <input
            id="upgrade-limit"
            className={limitError ? "pv-inp pv-mono pm-inp-err" : "pv-inp pv-mono"}
            style={{ width: 104, height: 40, textAlign: "right", fontSize: 15 }}
            value={limit}
            onChange={(event) => setLimit(event.target.value)}
            onBlur={() => {
              const parsed = parseLimit(limit);
              if (parsed !== null) setLimit(formatLimit(parsed));
            }}
            aria-invalid={limitError ? true : undefined}
            aria-describedby={limitError ? "upgrade-limit-error" : undefined}
          />
        </div>

        <div className="pm-set" style={{ flexDirection: "column", alignItems: "flex-start", gap: 12 }}>
          <span className="pm-set-label">Payment</span>
          {cardAdded && !showCard ? (
            <p style={{ margin: 0, fontSize: 14, color: "var(--ink-2)" }}>
              Card ending in {cardLast4}.{" "}
              <button
                type="button"
                className="text-button"
                onClick={() => {
                  setCardSubmitted(false);
                  setShowCard(true);
                }}
              >
                Change card
              </button>
            </p>
          ) : showCard ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 420 }}>
              <CardField id="card-number" label="Card number" error={cardNumberError}>
                <input
                  id="card-number"
                  name="card-number"
                  type="text"
                  inputMode="numeric"
                  autoComplete="cc-number"
                  className={cardNumberError ? "pv-inp pm-inp-err" : "pv-inp"}
                  style={{ width: "100%" }}
                  value={cardNumber}
                  onChange={(event) => setCardNumber(event.target.value)}
                  aria-invalid={cardNumberError ? true : undefined}
                  aria-describedby={fieldDescribedBy("card-number", { error: cardNumberError })}
                />
              </CardField>
              <div style={{ display: "flex", gap: 12 }}>
                <CardField id="card-expiry" label="Expiry" error={cardExpiryError}>
                  <input
                    id="card-expiry"
                    name="card-expiry"
                    type="text"
                    inputMode="numeric"
                    autoComplete="cc-exp"
                    placeholder="MM/YY"
                    className={cardExpiryError ? "pv-inp pm-inp-err" : "pv-inp"}
                    style={{ width: "100%" }}
                    value={cardExpiry}
                    onChange={(event) => setCardExpiry(event.target.value)}
                    aria-invalid={cardExpiryError ? true : undefined}
                    aria-describedby={fieldDescribedBy("card-expiry", { error: cardExpiryError })}
                  />
                </CardField>
                <CardField id="card-cvc" label="CVC" error={cardCvcError}>
                  <input
                    id="card-cvc"
                    name="card-cvc"
                    type="text"
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    className={cardCvcError ? "pv-inp pm-inp-err" : "pv-inp"}
                    style={{ width: "100%" }}
                    value={cardCvc}
                    onChange={(event) => setCardCvc(event.target.value)}
                    aria-invalid={cardCvcError ? true : undefined}
                    aria-describedby={fieldDescribedBy("card-cvc", { error: cardCvcError })}
                  />
                </CardField>
              </div>
              <div className="row">
                <Button type="button" variant="primary" onClick={onSaveCard}>
                  Save card
                </Button>
                <Button type="button" variant="quiet" onClick={() => setShowCard(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button type="button" variant="secondary" onClick={() => setShowCard(true)} style={{ minHeight: 40, padding: "0 16px", fontSize: 14 }}>
              <Icon name="card" style={{ color: "var(--ink)" }} />
              Add a card
            </Button>
          )}
          {paymentError ? (
            <span role="alert" style={{ fontSize: 13, color: "var(--danger)" }}>
              {paymentError}
            </span>
          ) : null}
          <span style={{ fontSize: 13, color: "var(--ink-3)" }}>
            Or <a href="#">pay annually by invoice</a>.
          </span>
        </div>
      </form>

      <aside aria-label="Summary" className="pm-sheet pm-lift pm-upgrade-summary">
        <h2>Team plan</h2>
        <div className="pm-uli">
          <span>
            {seats} seats × ${upgrade.perSeat}
          </span>
          <span>{money(seatsTotal)}</span>
        </div>
        <div className="pm-uli">
          <span>
            Model use at cost
            <br />
            <span style={{ fontSize: 12, color: "var(--ink-3)" }}>Billed after each month, never over {limitLabel}</span>
          </span>
          <span style={{ color: "var(--ink-3)" }}>up to {limitLabel}</span>
        </div>
        <div className="pm-uli pm-uli-total">
          <span>Charged {upgrade.chargedDate}</span>
          <span>{money(seatsTotal)}</span>
        </div>
        <p className="pm-trial-note" style={{ margin: "10px 0 0", fontSize: 12.5, padding: "12px 14px" }}>
          {upgrade.footerNote}
        </p>
        <Button type="submit" form="upgrade-form" variant="primary" className="pm-btn-xl pm-btn-full" style={{ marginTop: 18 }}>
          Start Team on {upgrade.chargedDate}
        </Button>
      </aside>
    </>
  );
}

function CardField({ id, label, error, children }: { id: string; label: string; error?: string; children: ReactNode }) {
  return (
    <div className="pm-field" style={{ flex: "1 1 120px" }}>
      <label htmlFor={id}>{label}</label>
      {children}
      {error ? (
        <span id={`${id}-error`} role="alert" className="pm-err">
          <Icon name="warning" />
          <span>{error}</span>
        </span>
      ) : null}
    </div>
  );
}
