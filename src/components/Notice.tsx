import type { ReactNode } from "react";
import { cx } from "../lib/utils";

export function Notice({
  variant = "blocking",
  headline,
  lead,
  children,
  actions,
}: {
  variant?: "blocking" | "warning";
  headline: ReactNode;
  lead?: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
}) {
  const isBlocking = variant === "blocking";
  return (
    <section
      className={cx("notice", !isBlocking && "notice-warning")}
      role={isBlocking ? "alert" : undefined}
      aria-label={typeof headline === "string" ? headline : undefined}
    >
      <h2 className="notice-headline">{headline}</h2>
      {lead ? <p className="notice-lead ui-strong">{lead}</p> : null}
      {children ? <div className="ui-text stack-3">{children}</div> : null}
      {actions ? <div className="row">{actions}</div> : null}
    </section>
  );
}
