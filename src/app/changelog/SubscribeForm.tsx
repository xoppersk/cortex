"use client";

import { useState } from "react";
import type { FormEvent } from "react";

/*
 * P-05 subscribe form — Premium v2 (screens/Changelog.html): a white card
 * holding a mail icon, a borderless email input and a Subscribe (ink)
 * button. Validation follows the Field spec (brief §10): validate on
 * submit, then on change; the error sits under the form in --danger, and
 * while it is present the card's ring turns --danger — the Field-spec
 * border, applied to the ring because the input itself is borderless.
 * On success the form stays in place and a status line appears under it.
 */
function IconMail() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="ic"
    >
      <rect x="2" y="3.5" width="12" height="9" rx="1.5" />
      <path d="m2.5 4.5 5.5 4 5.5-4" />
    </svg>
  );
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function SubscribeForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [subscribed, setSubscribed] = useState(false);
  const [touched, setTouched] = useState(false);

  function validate(value: string): string | null {
    if (value.trim().length === 0) return "Enter your email address.";
    if (!EMAIL_PATTERN.test(value.trim())) return "Enter a valid email address.";
    return null;
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched(true);
    const problem = validate(email);
    setError(problem);
    if (!problem) setSubscribed(true);
  }

  function onChange(value: string) {
    setEmail(value);
    setSubscribed(false);
    if (touched) setError(validate(value));
  }

  return (
    <div className="pub-subscribe">
      <form
        className="pub-subscribe-form"
        onSubmit={onSubmit}
        noValidate
        style={
          error
            ? { boxShadow: "0 0 0 1px var(--danger), 0 1px 2px rgba(27, 27, 26, 0.04)" }
            : undefined
        }
      >
        <label htmlFor="em" className="sr-only">
          Email address
        </label>
        <IconMail />
        <input
          id="em"
          type="email"
          placeholder="Email for monthly updates"
          className="pub-subscribe-input"
          value={email}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "em-error" : subscribed ? "em-status" : undefined}
          onChange={(event) => onChange(event.target.value)}
        />
        <button type="submit" className="btn dk">
          Subscribe
        </button>
      </form>
      {error ? (
        <p id="em-error" className="pub-subscribe-error" role="alert">
          {error}
        </p>
      ) : subscribed ? (
        <p id="em-status" className="pub-subscribe-status" role="status">
          You’re on the list.
        </p>
      ) : null}
    </div>
  );
}
