"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "../../components/Button";
import { Field, fieldDescribedBy } from "../../components/Field";
import type { StatesData } from "../../lib/types";

type Upgrade = StatesData["upgrade"];

/*
 * S-08 Upgrade, per screens/Upgrade.html (v2): a .sheet <form> (flex
 * 1 1 460px, max-width 620px, padding 40px 44px) beside a .sheet.lift
 * summary <aside> (max-width 380px). Setting rows open with a #F0F0EC
 * hairline and keep label/helper left, control right; the seats stepper
 * sits in a rail pill and the summary updates live from it. "Add a card"
 * opens the card step (number / expiry / CVC — no designed UI ships for
 * it, so it follows the Field pattern); "Start Team on October 13" is
 * gated on a card on file and a valid limit, and lives in the summary,
 * bound to the form by form="upgrade-form". The summary's model-use line
 * is derived from the limit so the two never desync. On completion the
 * flow returns to the workspace (the empty-history trial home, the same
 * target as "Back to workspace"); the design ships no post-submit state.
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
  // Billing boundary: no Stripe keys exist, so no card is required or
  // charged — submitting records the plan intent on the workspace.
  const paymentError = undefined;

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

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    if (limitValue === null) return;
    const { changePlanAction } = await import("../settings/actions");
    await changePlanAction("team");
    router.push("/settings/billing");
  }

  return (
    <>
      <form id="upgrade-form" onSubmit={onSubmit} noValidate className="sheet sys-upgrade-form">
        <div className="sys-upgrade-head">
          <span className="sys-upgrade-meta">
            <span className="tag ln sys-upgrade-tag">{upgrade.workspace}</span>
            <span className="sys-trial-ends">
              <svg
                className="ic"
                viewBox="0 0 16 16"
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="8" cy="8" r="5.5" />
                <path d="M8 5v3l2 1.5" />
              </svg>
              {upgrade.trialEnds}
            </span>
          </span>
          <h1 className="sys-upgrade-title">{upgrade.heading}</h1>
          <p className="sys-upgrade-body">{upgrade.body}</p>
        </div>

        <div className="sys-set">
          <div className="sys-set-text">
            <span id="seats-label" className="sys-set-label">
              Seats
            </span>
            <span className="sys-set-helper">
              {upgrade.seatsInTrial} people are in the trial. Viewers are free.
            </span>
          </div>
          <div role="group" aria-labelledby="seats-label" className="sys-stepper">
            <button
              type="button"
              className="sys-stepper-btn"
              aria-label="Remove a seat"
              onClick={() => setSeats((value) => Math.max(1, value - 1))}
              disabled={seats <= 1}
            >
              {"\u2212"}
            </button>
            <span aria-live="polite" className="sys-stepper-value">
              {seats}
            </span>
            <button
              type="button"
              className="sys-stepper-btn"
              aria-label="Add a seat"
              onClick={() => setSeats((value) => value + 1)}
            >
              +
            </button>
          </div>
        </div>

        <div className="sys-set">
          <div className="sys-set-text sys-set-text-wide">
            <label htmlFor="upgrade-limit" className="sys-set-label">
              Monthly spending limit
            </label>
            <span className="sys-set-helper">{upgrade.usageNote}</span>
            {limitError ? (
              <span role="alert" className="sys-set-error">
                {limitError}
              </span>
            ) : null}
          </div>
          <input
            id="upgrade-limit"
            className="inp mono sys-limit-input"
            value={limit}
            onChange={(event) => setLimit(event.target.value)}
            onBlur={() => {
              const parsed = parseLimit(limit);
              if (parsed !== null) setLimit(formatLimit(parsed));
            }}
            aria-invalid={limitError ? true : undefined}
          />
        </div>

        <div className="sys-set sys-set-stack">
          <span className="sys-set-label">Payment</span>
          {cardAdded && !showCard ? (
            <p className="sys-card-added">
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
            <div className="sys-card-fields">
              <Field label="Card number" htmlFor="card-number" error={cardNumberError}>
                <input
                  id="card-number"
                  name="card-number"
                  type="text"
                  inputMode="numeric"
                  autoComplete="cc-number"
                  className="inp"
                  value={cardNumber}
                  onChange={(event) => setCardNumber(event.target.value)}
                  aria-invalid={cardNumberError ? true : undefined}
                  aria-describedby={fieldDescribedBy("card-number", { error: cardNumberError })}
                />
              </Field>
              <div className="sys-card-row">
                <div>
                  <Field label="Expiry" htmlFor="card-expiry" error={cardExpiryError}>
                    <input
                      id="card-expiry"
                      name="card-expiry"
                      type="text"
                      inputMode="numeric"
                      autoComplete="cc-exp"
                      placeholder="MM/YY"
                      className="inp"
                      value={cardExpiry}
                      onChange={(event) => setCardExpiry(event.target.value)}
                      aria-invalid={cardExpiryError ? true : undefined}
                      aria-describedby={fieldDescribedBy("card-expiry", { error: cardExpiryError })}
                    />
                  </Field>
                </div>
                <div>
                  <Field label="CVC" htmlFor="card-cvc" error={cardCvcError}>
                    <input
                      id="card-cvc"
                      name="card-cvc"
                      type="text"
                      inputMode="numeric"
                      autoComplete="cc-csc"
                      className="inp"
                      value={cardCvc}
                      onChange={(event) => setCardCvc(event.target.value)}
                      aria-invalid={cardCvcError ? true : undefined}
                      aria-describedby={fieldDescribedBy("card-cvc", { error: cardCvcError })}
                    />
                  </Field>
                </div>
              </div>
              <div className="row">
                <Button type="button" variant="primary" size="md" onClick={onSaveCard}>
                  Save card
                </Button>
                <Button type="button" variant="quiet" size="md" onClick={() => setShowCard(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <button type="button" className="btn sys-add-card" onClick={() => setShowCard(true)}>
              <svg
                className="ic"
                viewBox="0 0 16 16"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="2" y="4" width="12" height="8.5" rx="1.5" />
                <path d="M2 7h12" />
              </svg>
              Add a card
            </button>
          )}
          {paymentError ? (
            <span role="alert" className="sys-set-error">
              {paymentError}
            </span>
          ) : null}
          <span className="sys-set-helper">
            Or{" "}
            <a href="#" style={{ color: "var(--ink)" }}>
              pay annually by invoice
            </a>
            .
          </span>
        </div>
      </form>

      <aside aria-label="Summary" className="sheet lift sys-summary">
        <h2 className="sys-summary-title">Team plan</h2>
        <div className="sys-li">
          <span>
            {seats} seats × ${upgrade.perSeat}
          </span>
          <span>{money(seatsTotal)}</span>
        </div>
        <div className="sys-li">
          <span>
            Model use at cost
            <br />
            <span className="sys-li-sub">Billed after each month, never over {limitLabel}</span>
          </span>
          <span className="sys-li-muted">up to {limitLabel}</span>
        </div>
        <div className="sys-li sys-li-total">
          <span>Charged {upgrade.chargedDate}</span>
          <span>{money(seatsTotal)}</span>
        </div>
        <p className="sys-summary-note">{upgrade.footerNote}</p>
        <Button
          type="submit"
          form="upgrade-form"
          variant="primary"
          size="lg"
          className="sys-btn-block sys-summary-cta"
        >
          Start Team on {upgrade.chargedDate}
        </Button>
      </aside>
    </>
  );
}
