"use client";

import { useState } from "react";
import type { FormEvent } from "react";

/*
 * P-05 subscribe form, built to the canvas control pairing: a plain 14px
 * input and a bespoke submit button with a 1px ink border (neither the DS
 * primary nor secondary button). On submit the form stays in place and a
 * status line appears under it (brief §10 form behaviour).
 */
export function SubscribeForm() {
  const [subscribed, setSubscribed] = useState(false);
  const [email, setEmail] = useState("");

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (email.trim().length > 0) setSubscribed(true);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <form onSubmit={onSubmit} style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <label htmlFor="changelog-email" className="sr-only">
          Email address
        </label>
        <input
          id="changelog-email"
          type="email"
          required
          placeholder="Email for monthly updates"
          className="field-control"
          style={{ width: 240, minHeight: 36, fontSize: 14, padding: "0 10px" }}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <button
          type="submit"
          style={{
            height: 36,
            padding: "0 14px",
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
          Subscribe
        </button>
      </form>
      {subscribed ? (
        <p className="ui-text" role="status" style={{ fontSize: 14 }}>
          You’re on the list.
        </p>
      ) : null}
    </div>
  );
}
