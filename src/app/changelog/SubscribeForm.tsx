"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "../../components/Button";

/* P-05 subscribe form: on submit, replace the form with a status line. */
export function SubscribeForm() {
  const [subscribed, setSubscribed] = useState(false);
  const [email, setEmail] = useState("");

  if (subscribed) {
    return (
      <p className="ui-text" role="status" style={{ fontSize: 14 }}>
        You’re on the list.
      </p>
    );
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (email.trim().length > 0) setSubscribed(true);
  }

  return (
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
        style={{ width: 240, minHeight: 36 }}
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
      <Button type="submit" variant="secondary" size="md">
        Subscribe
      </Button>
    </form>
  );
}
