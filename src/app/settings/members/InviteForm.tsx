"use client";

import { useState } from "react";
import { Button } from "../../../components/Button";
import { Icon } from "../../../components/Icon";
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
    <form onSubmit={handleSubmit} noValidate className="pv-card pv-invite" aria-label="Invite people">
      <div className="pv-invite-field" style={{ flex: "1 1 300px" }}>
        <label htmlFor="invite-email">Invite by email</label>
        <input
          id="invite-email"
          className="pv-inp"
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
      <div className="pv-invite-field">
        <label htmlFor="invite-role">Role</label>
        <select
          id="invite-role"
          className="pv-sel"
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
      <Button variant="primary" type="submit" style={{ minHeight: 34, padding: "0 16px" }}>
        <Icon name="mail" size={14} strokeWidth={1.6} style={{ color: "currentColor" }} />
        Send invite
      </Button>
      {error ? (
        <p className="pv-invite-error" id="invite-email-error" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
