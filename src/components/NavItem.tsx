import Link from "next/link";
import type { ReactNode } from "react";
import { cx } from "../lib/utils";

export function NavItem({
  href,
  active = false,
  count,
  countTone,
  indent = false,
  children,
}: {
  href: string;
  active?: boolean;
  count?: ReactNode;
  countTone?: "danger";
  indent?: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="nav-item"
      aria-current={active ? "page" : undefined}
      style={indent ? { paddingLeft: 22 } : undefined}
    >
      <span>{children}</span>
      {count !== undefined ? (
        <span className={cx("nav-item-count", countTone === "danger" && "nav-item-count-danger")}>{count}</span>
      ) : null}
    </Link>
  );
}
