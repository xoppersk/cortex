"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button } from "../../components/Button";
import { Field, fieldDescribedBy } from "../../components/Field";
import { updatePasswordAction, type AuthFormState } from "../../lib/auth/actions";

const initialState: AuthFormState = {};

/*
 * Set a new password. Reached only with a live recovery session (the
 * /auth/callback route exchanges the reset email's code first); without
 * one, `updatePasswordAction` returns the expired-link error below.
 */
export function ResetPasswordForm({ hasSession }: { hasSession: boolean }) {
  const [state, formAction, pending] = useActionState(updatePasswordAction, initialState);
  const passwordError = state.fieldErrors?.password;
  const confirmError = state.fieldErrors?.confirmPassword;

  if (!hasSession) {
    return (
      <div className="sheet lift sys-signup-form">
        <h1 className="sys-form-title">This link has expired</h1>
        <p className="ui-text" style={{ fontSize: 14, lineHeight: 1.55 }}>
          Password reset links work once and expire in one hour. Request a fresh one and use it
          straight away.
        </p>
        <p className="sys-legal-note">
          <Link href="/forgot-password">Request a new reset link</Link> ·{" "}
          <Link href="/login">Sign in</Link>
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="sheet lift sys-signup-form">
      <h1 className="sys-form-title">Choose a new password</h1>
      {state.error ? (
        <p className="sys-set-error" role="alert">
          {state.error}
        </p>
      ) : null}
      <Field label="New password" htmlFor="reset-password" error={passwordError} helper="At least 8 characters.">
        <input
          id="reset-password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          className={passwordError ? "inp lg sys-inp-error" : "inp lg"}
          aria-invalid={passwordError ? true : undefined}
          aria-describedby={fieldDescribedBy("reset-password", {
            helper: "At least 8 characters.",
            error: passwordError,
          })}
        />
      </Field>
      <Field label="Confirm new password" htmlFor="reset-password-confirm" error={confirmError}>
        <input
          id="reset-password-confirm"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          className={confirmError ? "inp lg sys-inp-error" : "inp lg"}
          aria-invalid={confirmError ? true : undefined}
          aria-describedby={fieldDescribedBy("reset-password-confirm", { error: confirmError })}
        />
      </Field>
      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="sys-btn-block sys-signup-submit"
        disabled={pending}
      >
        {pending ? "Updating…" : "Update password"}
      </Button>
    </form>
  );
}
