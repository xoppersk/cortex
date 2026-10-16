import Link from "next/link";
import type { ReactNode } from "react";
import { cx } from "../lib/utils";

/*
 * Rail navigation item (v2 screens' .nv): icon, label, right-aligned mono
 * count (.ct). Current page = white card with the ring shadow; an open
 * "recent" conversation uses the selected fill instead (.nv-recent-active).
 */
export function NavItem({
  href,
  active = false,
  recentActive = false,
  count,
  countTone,
  indent = false,
  icon,
  children,
}: {
  href: string;
  active?: boolean;
  recentActive?: boolean;
  count?: ReactNode;
  countTone?: "danger";
  indent?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cx("nv", "nav-item", recentActive && "nv-recent-active")}
      aria-current={active || recentActive ? "page" : undefined}
      style={indent ? { paddingLeft: 22 } : undefined}
    >
      {icon}
      <span>{children}</span>
      {count !== undefined ? (
        <span className={cx("ct", "nav-item-count", countTone === "danger" && "nav-item-count-danger")}>{count}</span>
      ) : null}
    </Link>
  );
}
