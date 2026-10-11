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
const EMAIL_HELPER =
  "Use your work address so teammates can find your workspace. Personal addresses can join a workspace but not start one.";

export function SignupForm({
  signupError,
  initialErrorState = false,
  errorName = "",
  errorEmail = "",
}: {
  signupError: string;
  initialErrorState?: boolean;
  errorName?: string;
  errorEmail?: string;
}) {
  const [name, setName] = useState(initialErrorState ? errorName : "");
  const [email, setEmail] = useState(initialErrorState ? errorEmail : "");
  const [submitted, setSubmitted] = useState(initialErrorState);
  const [created, setCreated] = useState(false);

  const domain = email.split("@")[1]?.toLowerCase() ?? "";
  const emailError = submitted && PERSONAL_DOMAINS.includes(domain) ? signupError : undefined;

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    if (!PERSONAL_DOMAINS.includes(domain) && name.trim() && email.trim()) {
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
    <form className="stack-4" onSubmit={onSubmit} noValidate>
      <Field label="Your name" htmlFor="signup-name">
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
      <Field label="Work email" htmlFor="signup-email" error={emailError} helper={EMAIL_HELPER}>
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
          aria-describedby={fieldDescribedBy("signup-email", { helper: EMAIL_HELPER, error: emailError })}
        />
      </Field>
      <Button type="submit" variant="primary" size="lg" className="btn-block">
        Continue
      </Button>
    </form>
  );
}
