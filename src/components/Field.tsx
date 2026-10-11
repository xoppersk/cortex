import type { ReactNode } from "react";

export function Field({
  label,
  htmlFor,
  helper,
  error,
  changedFrom,
  children,
}: {
  label: string;
  htmlFor: string;
  helper?: string;
  error?: string;
  changedFrom?: string;
  children: ReactNode;
}) {
  const errorId = error ? `${htmlFor}-error` : undefined;
  const helperId = helper ? `${htmlFor}-helper` : undefined;
  return (
    <div className="field">
      <label className="field-label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {changedFrom ? <p className="changed-note">changed from {changedFrom}</p> : null}
      {helper ? (
        <p className="field-helper" id={helperId}>
          {helper}
        </p>
      ) : null}
      {error ? (
        <p className="field-error" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function fieldDescribedBy(htmlFor: string, options: { helper?: string; error?: string }) {
  return [options.helper ? `${htmlFor}-helper` : null, options.error ? `${htmlFor}-error` : null]
    .filter(Boolean)
    .join(" ") || undefined;
}
