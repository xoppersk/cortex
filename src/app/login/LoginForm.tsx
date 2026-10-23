"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button } from "../../components/Button";
import { Field, fieldDescribedBy } from "../../components/Field";
import { IconArrowRight } from "../../components/icons";
import { signInAction, type AuthFormState } from "../../lib/auth/actions";

const initialState: AuthFormState = {};

/*
 * S-01 Login form — real email + password sign-in (Supabase Auth).
 *
 * Production deviates from the design screen here: the design was an
 * email-link form with Google/SSO buttons, but no OAuth providers are
 * configured in this project and the production contract is
 * email+password. The password field and error states reuse the design
 * system's own field/error language (see PRODUCTION-LOG W1 notes).
 */
export function LoginForm({
  next,
  linkError,
}: {
  next?: string;
  linkError?: boolean;
}) {
  const [state, formAction, pending] = useActionState(signInAction, initialState);
  const emailError = state.fieldErrors?.email;
  const passwordError = state.fieldErrors?.password;

  return (
    <form action={formAction} className="sheet lift sys-login-form">
      <h1 className="sys-login-title">Sign in</h1>
      {next ? <input type="hidden" name="next" value={next} /> : null}
      {linkError && !state.error ? (
        <p className="sys-set-error" role="alert">
          That email link has expired or was already used. Sign in with your password, or request a
          fresh link.
        </p>
      ) : null}
      {state.error ? (
        <span className="sys-signup-error" role="alert">
          <svg
            className="ic"
            viewBox="0 0 16 16"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M8 2.5 14 13H2z" />
            <path d="M8 6.5v3M8 11.2v.3" />
          </svg>
          <span>{state.error}</span>
        </span>
      ) : null}
      <Field label="Work email" htmlFor="login-email" error={emailError}>
        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className={emailError ? "inp lg sys-inp-error" : "inp lg"}
          aria-invalid={emailError ? true : undefined}
          aria-describedby={fieldDescribedBy("login-email", { error: emailError })}
        />
      </Field>
      <Field label="Password" htmlFor="login-password" error={passwordError}>
        <input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={passwordError ? "inp lg sys-inp-error" : "inp lg"}
          aria-invalid={passwordError ? true : undefined}
          aria-describedby={fieldDescribedBy("login-password", { error: passwordError })}
        />
      </Field>
      <p className="sys-legal-note">
        <Link href="/forgot-password">Forgot your password?</Link>
      </p>
      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="sys-btn-block sys-login-submit"
        disabled={pending}
      >
        {pending ? "Signing in…" : "Sign in"}{" "}
        <IconArrowRight style={{ width: 15, height: 15, color: "var(--on-ink)" }} />
      </Button>
      <p className="sys-login-new">
        New to Cortex? <Link href="/signup">Start a free trial</Link>
      </p>
    </form>
  );
}
