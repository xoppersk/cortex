"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import { Button } from "../../components/Button";
import { Field, fieldDescribedBy } from "../../components/Field";
import type { StatesData } from "../../lib/types";

type Upgrade = StatesData["upgrade"];

/*
 * S-08 Upgrade, per screens/Upgrade.html: a <form> (flex 1 1 460px,
 * max-width 560px) beside a tint summary <aside>. Sections open with a
 * --rule hairline and keep label/helper left, control right. "Add a card"
 * (1px ink border) opens the card step (number / expiry / CVC); "Start
 * Team" is gated on a card on file and a valid limit. The summary's
 * model-use line is derived from the limit so the two never desync.
 * On completion the flow returns to the workspace (the empty-history
 * trial home, the same target as "Back to workspace"); the design ships
 * no post-submit state.
 */

const sectionRow: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  paddingTop: 22,
  borderTop: "1px solid var(--rule)",
};

const sectionLabel: CSSProperties = { fontSize: 14, fontWeight: 600, color: "var(--ink)" };
const sectionHelper: CSSProperties = { fontSize: 13, color: "var(--ink-3)" };

const summaryRow: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) 110px",
  gap: 16,
  padding: "11px 0",
  fontSize: 14,
};

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

  const stepperButton: CSSProperties = {
    width: 36,
    height: 36,
    border: "1px solid var(--rule-strong)",
    background: "var(--paper)",
    fontSize: 18,
    fontWeight: 500,
    color: "var(--ink)",
    cursor: "pointer",
  };

  return (
    <>
      <form
        id="upgrade-form"
        onSubmit={onSubmit}
        noValidate
        style={{
          flex: "1 1 460px",
          maxWidth: 560,
          display: "flex",
          flexDirection: "column",
          gap: 26,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <span style={{ fontSize: 13, color: "var(--warn)", fontWeight: 500 }}>
            {upgrade.trialEnds}
          </span>
          <h1
            style={{
              margin: 0,
              fontFamily: "var(--font-serif)",
              fontSize: 40,
              lineHeight: 1.1,
              fontWeight: 600,
              letterSpacing: "-0.025em",
              color: "var(--ink)",
            }}
          >
            {upgrade.heading}
          </h1>
          <p
            style={{
              margin: 0,
              fontFamily: "var(--font-serif)",
              fontSize: 18,
              lineHeight: 1.55,
              fontWeight: 400,
              color: "var(--ink-body)",
            }}
          >
            {upgrade.body}
          </p>
        </div>

        <div style={sectionRow}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span id="seats-label" style={sectionLabel}>
              Seats
            </span>
            <span style={sectionHelper}>
              {upgrade.seatsInTrial} people are in the trial. Viewers are free.
            </span>
          </div>
          <div role="group" aria-labelledby="seats-label" style={{ display: "flex", alignItems: "center" }}>
            <button
              type="button"
              aria-label="Remove a seat"
              onClick={() => setSeats((value) => Math.max(1, value - 1))}
              disabled={seats <= 1}
              style={{ ...stepperButton, borderRadius: "6px 0 0 6px" }}
            >
              −
            </button>
            <span
              aria-live="polite"
              style={{
                width: 52,
                height: 36,
                display: "grid",
                placeItems: "center",
                borderTop: "1px solid var(--rule-strong)",
                borderBottom: "1px solid var(--rule-strong)",
                fontSize: 15,
                fontWeight: 600,
                boxSizing: "border-box",
              }}
            >
              {seats}
            </span>
            <button
              type="button"
              aria-label="Add a seat"
              onClick={() => setSeats((value) => value + 1)}
              style={{ ...stepperButton, borderRadius: "0 6px 6px 0" }}
            >
              +
            </button>
          </div>
        </div>

        <div style={sectionRow}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label htmlFor="upgrade-limit" style={sectionLabel}>
              Monthly spending limit
            </label>
            <span style={sectionHelper}>{upgrade.usageNote}</span>
            {limitError ? (
              <span role="alert" style={{ fontSize: 13, color: "var(--danger)" }}>
                {limitError}
              </span>
            ) : null}
          </div>
          <input
            id="upgrade-limit"
            className="field-control"
            style={{
              width: 96,
              height: 36,
              minHeight: 36,
              padding: "0 10px",
              textAlign: "right",
              fontSize: 14,
            }}
            value={limit}
            onChange={(event) => setLimit(event.target.value)}
            onBlur={() => {
              const parsed = parseLimit(limit);
              if (parsed !== null) setLimit(formatLimit(parsed));
            }}
            aria-invalid={limitError ? true : undefined}
          />
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            paddingTop: 22,
            borderTop: "1px solid var(--rule)",
          }}
        >
          <span style={sectionLabel}>Payment</span>
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
            <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 420 }}>
              <Field label="Card number" htmlFor="card-number" error={cardNumberError}>
                <input
                  id="card-number"
                  name="card-number"
                  type="text"
                  inputMode="numeric"
                  autoComplete="cc-number"
                  className="field-control"
                  value={cardNumber}
                  onChange={(event) => setCardNumber(event.target.value)}
                  aria-invalid={cardNumberError ? true : undefined}
                  aria-describedby={fieldDescribedBy("card-number", { error: cardNumberError })}
                />
              </Field>
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: "1 1 120px" }}>
                  <Field label="Expiry" htmlFor="card-expiry" error={cardExpiryError}>
                    <input
                      id="card-expiry"
                      name="card-expiry"
                      type="text"
                      inputMode="numeric"
                      autoComplete="cc-exp"
                      placeholder="MM/YY"
                      className="field-control"
                      value={cardExpiry}
                      onChange={(event) => setCardExpiry(event.target.value)}
                      aria-invalid={cardExpiryError ? true : undefined}
                      aria-describedby={fieldDescribedBy("card-expiry", { error: cardExpiryError })}
                    />
                  </Field>
                </div>
                <div style={{ flex: "1 1 120px" }}>
                  <Field label="CVC" htmlFor="card-cvc" error={cardCvcError}>
                    <input
                      id="card-cvc"
                      name="card-cvc"
                      type="text"
                      inputMode="numeric"
                      autoComplete="cc-csc"
                      className="field-control"
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
                <Button
                  type="button"
                  variant="quiet"
                  size="md"
                  onClick={() => setShowCard(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowCard(true)}
              style={{
                alignSelf: "flex-start",
                height: 40,
                padding: "0 16px",
                border: "1px solid var(--ink)",
                borderRadius: "var(--radius-m)",
                background: "var(--paper)",
                color: "var(--ink)",
                fontSize: 14,
                fontWeight: 500,
                lineHeight: 1,
                cursor: "pointer",
              }}
            >
              Add a card
            </button>
          )}
          {paymentError ? (
            <span role="alert" style={{ fontSize: 13, color: "var(--danger)" }}>
              {paymentError}
            </span>
          ) : null}
          <span style={{ fontSize: 13, color: "var(--ink-3)" }}>
            Or{" "}
            <a href="#" style={{ color: "var(--ink-2)" }}>
              pay annually by invoice
            </a>
            .
          </span>
        </div>
      </form>

      <aside
        aria-label="Summary"
        style={{
          flex: "1 1 300px",
          maxWidth: 360,
          alignSelf: "flex-start",
          padding: 24,
          background: "var(--tint)",
          borderRadius: "var(--radius-l)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <h2
          style={{
            margin: "0 0 10px",
            fontFamily: "var(--font-serif)",
            fontSize: 20,
            lineHeight: 1.2,
            fontWeight: 600,
            color: "var(--ink)",
          }}
        >
          Team plan
        </h2>
        <div style={summaryRow} className="upgrade-summary-row">
          <span>
            {seats} seats × ${upgrade.perSeat}
          </span>
          <span style={{ textAlign: "right" }}>{money(seatsTotal)}</span>
        </div>
        <div style={{ ...summaryRow, borderTop: "1px solid var(--rule)" }} className="upgrade-summary-row">
          <span>
            Model use at cost
            <br />
            <span style={{ fontSize: 12, color: "var(--ink-3)" }}>
              Billed after each month, never over {limitLabel}
            </span>
          </span>
          <span style={{ textAlign: "right", color: "var(--ink-3)" }}>up to {limitLabel}</span>
        </div>
        <div
          className="upgrade-summary-row"
          style={{
            ...summaryRow,
            borderTop: "1px solid var(--ink)",
            fontWeight: 600,
          }}
        >
          <span>Charged {upgrade.chargedDate}</span>
          <span style={{ textAlign: "right" }}>{money(seatsTotal)}</span>
        </div>
        <p style={{ margin: "14px 0 0", fontSize: 12, lineHeight: 1.5, color: "var(--ink-2)" }}>
          {upgrade.footerNote}
        </p>
        <Button
          type="submit"
          form="upgrade-form"
          variant="primary"
          size="lg"
          className="btn-block"
          style={{ marginTop: 18 }}
        >
          Start Team on {upgrade.chargedDate}
        </Button>
      </aside>
    </>
  );
}
