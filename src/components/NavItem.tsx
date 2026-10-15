import Link from "next/link";
import type { ReactNode } from "react";
import { cx } from "../lib/utils";
import { Icon, type IconName } from "./Icon";

/*
 * NavItem (Premium v2): 32px rail row with an optional 16px stroke icon and a
 * mono count. The current page is a white card on a hairline ring
 * (aria-current="page"); `selected` marks the open conversation in Recent
 * with the quieter `selected` fill.
 */
export function NavItem({
  href,
  active = false,
  selected = false,
  icon,
  count,
  countTone,
  indent = false,
  children,
}: {
  href: string;
  active?: boolean;
  selected?: boolean;
  icon?: IconName;
  count?: ReactNode;
  countTone?: "danger";
  indent?: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cx("nav-item", selected && "nav-item-selected")}
      aria-current={active ? "page" : undefined}
      style={indent ? { paddingLeft: 22 } : undefined}
    >
      {icon ? <Icon name={icon} /> : null}
      <span className="nav-item-label">{children}</span>
      {count !== undefined ? (
        <span className={cx("nav-item-count", countTone === "danger" && "nav-item-count-danger")}>{count}</span>
      ) : null}
    </Link>
  );
}
