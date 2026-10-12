"use client";

import { useState } from "react";
import { Button } from "../../../components/Button";
import type { Role } from "../../../lib/types";

const ROLES: Role[] = ["Editor", "Viewer", "Admin"];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function InviteForm({
  onInvite,
}: {
  onInvite: (invite: { email: string; role: Role }) => void;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("Editor");
  const [error, setError] = useState<string | undefined>(undefined);

  function validateEmail(value: string): string | undefined {
    if (!value.trim()) return "Enter an email address.";
    const first = value.split(",")[0]!.trim();
    if (!EMAIL_PATTERN.test(first)) return "Enter a valid email address.";
    return undefined;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const emailError = validateEmail(email);
    setError(emailError);
    if (emailError) return;
    onInvite({ email: email.trim().split(",")[0]!.trim(), role });
    setEmail("");
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div style={{ display: "flex", alignItems: "flex-end", gap: "var(--space-3)", flexWrap: "wrap" }}>
        <div className="field" style={{ flex: "1 1 260px" }}>
          <label className="field-label" htmlFor="invite-email" style={{ fontSize: 12, color: "var(--ink-3)" }}>
            Invite by email
          </label>
          <input
            id="invite-email"
            className="field-control field-control-32"
            style={{ height: 34 }}
            type="email"
            autoComplete="email"
            placeholder="name@company.com, separate several with commas"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (error) setError(validateEmail(event.target.value));
            }}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "invite-email-error" : undefined}
          />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="invite-role" style={{ fontSize: 12, color: "var(--ink-3)" }}>
            Role
          </label>
          <select
            id="invite-role"
            className="field-control field-control-32"
            style={{ height: 34, width: "auto" }}
            value={role}
            onChange={(event) => setRole(event.target.value as Role)}
          >
            {ROLES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <Button variant="primary" type="submit" style={{ minHeight: 34 }}>
          Send invite
        </Button>
      </div>
      {error ? (
        <p className="field-error" id="invite-email-error" role="alert" style={{ marginTop: "var(--space-2)" }}>
          {error}
        </p>
      ) : null}
    </form>
  );
}
