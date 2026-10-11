import Link from "next/link";
import type { ReactNode } from "react";
import { cx } from "../lib/utils";

export function LedgerRow({
  title,
  description,
  value,
  meta,
  featured = false,
  href,
  children,
}: {
  title: ReactNode;
  description?: ReactNode;
  value?: ReactNode;
  meta?: ReactNode;
  featured?: boolean;
  href?: string;
  children?: ReactNode;
}) {
  const content = (
    <>
      <span>
        <span className="ledger-row-title">{title}</span>
        {description ? (
          <>
            <br />
            <span className="ledger-row-description">{description}</span>
          </>
        ) : null}
      </span>
      {value ? <span className="ledger-row-value">{value}</span> : <span />}
      {meta ? <span className="ledger-row-meta">{meta}</span> : null}
      {children ? <span className="ledger-row-meta">{children}</span> : null}
    </>
  );

  const className = cx("ledger-row", featured && "ledger-row-featured");
  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }
  return <div className={className}>{content}</div>;
}
