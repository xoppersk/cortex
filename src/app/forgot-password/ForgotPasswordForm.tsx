"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button } from "../../components/Button";
import { Field, fieldDescribedBy } from "../../components/Field";
import { IconArrowRight } from "../../components/icons";
import { requestPasswordResetAction, type AuthFormState } from "../../lib/auth/actions";

const initialState: AuthFormState = {};

/*
 * Password reset request — sends the Supabase reset email, which lands on
 * /auth/callback?next=/reset-password. The confirmation state is shown
 * for every valid email submission, whether or not an account exists
 * (no account enumeration).
 */
export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestPasswordResetAction, initialState);
  const emailError = state.fieldErrors?.email;

  if (state.status === "reset-sent") {
    return (
      <div className="sheet lift sys-signup-form">
        <h1 className="sys-form-title">Check your email</h1>
        <p className="ui-text" style={{ fontSize: 14, lineHeight: 1.55 }}>
          If an account exists for <b>{state.email}</b>, we&rsquo;ve sent a link to reset its
          password. The link expires in one hour.
        </p>
        <p className="sys-legal-note">
          Back to <Link href="/login">sign in</Link>. No email after a few minutes? Check spam
          before requesting another link.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="sheet lift sys-signup-form">
      <h1 className="sys-form-title">Reset your password</h1>
      <p className="sys-set-helper" style={{ margin: 0 }}>
        Enter the email you sign in with and we&rsquo;ll send you a reset link.
      </p>
      <Field label="Work email" htmlFor="forgot-email" error={emailError}>
        <input
          id="forgot-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className={emailError ? "inp lg sys-inp-error" : "inp lg"}
          aria-invalid={emailError ? true : undefined}
          aria-describedby={fieldDescribedBy("forgot-email", { error: emailError })}
        />
      </Field>
      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="sys-btn-block sys-signup-submit"
        disabled={pending}
      >
        {pending ? "Sending…" : "Email me a reset link"}{" "}
        <IconArrowRight style={{ width: 15, height: 15, color: "var(--on-ink)" }} />
      </Button>
      <p className="sys-legal-note">
        Remembered it? <Link href="/login">Sign in</Link>
      </p>
    </form>
  );
}
