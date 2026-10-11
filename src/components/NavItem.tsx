import Link from "next/link";
import type { ReactNode } from "react";

export function NavItem({
  href,
  active = false,
  count,
  children,
}: {
  href: string;
  active?: boolean;
  count?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Link href={href} className="nav-item" aria-current={active ? "page" : undefined}>
      <span>{children}</span>
      {count !== undefined ? <span className="nav-item-count">{count}</span> : null}
    </Link>
  );
}
