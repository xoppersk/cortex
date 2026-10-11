"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "../../components/Button";
import { Field, fieldDescribedBy } from "../../components/Field";

/*
 * S-02 Signup form. Validates on submit, then on change once submitted.
 * Personal email domains are rejected with the fixture's exact error.
 * With ?state=error the page renders prefilled in the designed error state.
 */
const PERSONAL_DOMAINS = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com"];

export function SignupForm({
  signupError,
  initialErrorState = false,
}: {
  signupError: string;
  initialErrorState?: boolean;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState(initialErrorState ? "daniel.okafor@gmail.com" : "");
  const [password, setPassword] = useState("");
  const [submitted, setSubmitted] = useState(initialErrorState);
  const [created, setCreated] = useState(false);

  const domain = email.split("@")[1]?.toLowerCase() ?? "";
  const emailError = submitted && PERSONAL_DOMAINS.includes(domain) ? signupError : undefined;

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    if (!PERSONAL_DOMAINS.includes(domain) && name.trim() && email.trim() && password) {
      setCreated(true);
    }
  }

  if (created) {
    return (
      <p className="ui-text" role="status" style={{ fontSize: 14 }}>
        Your trial workspace is ready. Check {email} for the sign-in link.
      </p>
    );
  }

  return (
    <form className="stack-4" onSubmit={onSubmit}>
      <Field label="Name" htmlFor="signup-name">
        <input
          id="signup-name"
          name="name"
          type="text"
          autoComplete="name"
          required
          className="field-control"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </Field>
      <Field label="Work email" htmlFor="signup-email" error={emailError}>
        <input
          id="signup-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="field-control"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-invalid={emailError ? true : undefined}
          aria-describedby={fieldDescribedBy("signup-email", { error: emailError })}
        />
      </Field>
      <Field label="Password" htmlFor="signup-password">
        <input
          id="signup-password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          className="field-control"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </Field>
      <Button type="submit" variant="primary" size="lg" className="btn-block">
        Create workspace
      </Button>
    </form>
  );
}
