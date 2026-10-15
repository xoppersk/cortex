"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Icon } from "../../components/Icon";

/*
 * Changelog subscribe form (Premium v2): a white pill-card holding the mail
 * icon, a borderless input and the ink Subscribe button. On submit the form
 * stays in place and a status line appears under it.
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
      <form onSubmit={onSubmit} className="pm-subscribe">
        <label htmlFor="changelog-email" className="sr-only">
          Email address
        </label>
        <Icon name="mail" style={{ marginLeft: 8 }} />
        <input
          id="changelog-email"
          type="email"
          required
          placeholder="Email for monthly updates"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <button type="submit" className="btn btn-primary" style={{ minHeight: 34 }}>
          Subscribe
        </button>
      </form>
      {subscribed ? (
        <p role="status" style={{ margin: 0, fontSize: 14, color: "var(--ink-2)" }}>
          You’re on the list.
        </p>
      ) : null}
    </div>
  );
}
