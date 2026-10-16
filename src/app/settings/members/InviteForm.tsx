"use client";

import { useState } from "react";
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
      <div className="card ad-invite-card">
        <div className="field" style={{ flex: "1 1 300px" }}>
          <label className="ad-field-label" htmlFor="invite-email">
            Invite by email
          </label>
          <input
            id="invite-email"
            className="inp"
            style={{ width: "100%" }}
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
          <label className="ad-field-label" htmlFor="invite-role">
            Role
          </label>
          <select
            id="invite-role"
            className="sel ad-sel"
            style={{ width: 120 }}
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
        <button type="submit" className="btn dk" style={{ height: 34, padding: "0 16px" }}>
          <svg
            viewBox="0 0 16 16"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            aria-hidden="true"
          >
            <path d="M2.5 4.5h11v7h-11z" />
            <path d="m2.5 4.5 5.5 4 5.5-4" />
          </svg>
          Send invite
        </button>
      </div>
      {error ? (
        <p className="field-error" id="invite-email-error" role="alert" style={{ marginTop: "var(--space-2)" }}>
          {error}
        </p>
      ) : null}
    </form>
  );
}
