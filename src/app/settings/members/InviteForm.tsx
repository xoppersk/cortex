"use client";

import { useState } from "react";
import { Button } from "../../../components/Button";
import { Field, fieldDescribedBy } from "../../../components/Field";
import type { Role } from "../../../lib/types";

const ROLES: Role[] = ["Editor", "Viewer", "Admin"];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function InviteForm() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("Editor");
  const [error, setError] = useState<string | undefined>(undefined);
  const [submitted, setSubmitted] = useState(false);
  const [sentTo, setSentTo] = useState<{ email: string; role: Role } | null>(null);

  function validateEmail(value: string): string | undefined {
    if (!value.trim()) return "Enter an email address.";
    const first = value.split(",")[0]!.trim();
    if (!EMAIL_PATTERN.test(first)) return "Enter a valid email address.";
    return undefined;
  }

  function handleEmailChange(value: string) {
    setEmail(value);
    setSentTo(null);
    if (submitted) setError(validateEmail(value));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    const emailError = validateEmail(email);
    setError(emailError);
    if (emailError) return;
    setSentTo({ email: email.trim(), role });
  }

  return (
    <div className="stack-4">
      <form onSubmit={handleSubmit} noValidate className="stack-4">
        <Field label="Email" htmlFor="invite-email" error={error}>
          <input
            id="invite-email"
            className="field-control"
            type="email"
            autoComplete="email"
            placeholder="name@company.com, separate several with commas"
            value={email}
            onChange={(event) => handleEmailChange(event.target.value)}
            aria-invalid={error ? true : undefined}
            aria-describedby={fieldDescribedBy("invite-email", { error })}
          />
        </Field>
        <Field label="Role" htmlFor="invite-role">
          <select
            id="invite-role"
            className="field-control"
            value={role}
            onChange={(event) => setRole(event.target.value as Role)}
          >
            {ROLES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>
        <div>
          <Button variant="primary" size="md" type="submit">
            Send invite
          </Button>
        </div>
      </form>
      {sentTo ? (
        <div className="fragment stack-2" role="status">
          <p className="ui-strong">Invite pending</p>
          <p className="ui-text">
            {sentTo.email} · {sentTo.role}
          </p>
          <p className="caption">Invited just now. The invite expires in 7 days.</p>
        </div>
      ) : null}
    </div>
  );
}
