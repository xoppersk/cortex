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
  headline?: ReactNode;
  lead?: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
}) {
  const isBlocking = variant === "blocking";
  return (
    <section
      className={cx("notice", !isBlocking && "notice-warning")}
      role={isBlocking ? "alert" : "status"}
      aria-label={typeof headline === "string" ? headline : undefined}
    >
      {headline ? <h2 className="notice-headline">{headline}</h2> : null}
      {!isBlocking && lead ? (
        <p className="notice-body">
          <span className="notice-lead">{lead}</span> {children}
        </p>
      ) : (
        <>
          {lead ? <p className="notice-lead ui-strong">{lead}</p> : null}
          {children ? <div className="notice-body stack-3">{children}</div> : null}
        </>
      )}
      {actions ? <div className="row">{actions}</div> : null}
    </section>
  );
}
