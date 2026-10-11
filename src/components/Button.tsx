import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "../lib/utils";

export type ButtonVariant = "primary" | "secondary" | "quiet" | "destructive";
export type ButtonSize = "sm" | "md" | "lg";

interface SharedProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
  className?: string;
}

export function buttonClassName(variant: ButtonVariant = "secondary", size: ButtonSize = "md", className?: string) {
  return cx("btn", `btn-${variant}`, `btn-${size}`, className);
}

export function Button({
  variant = "secondary",
  size = "md",
  className,
  children,
  type = "button",
  ...props
}: SharedProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type={type} className={buttonClassName(variant, size, className)} {...props}>
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = "secondary",
  size = "md",
  className,
  children,
  href,
  ...props
}: SharedProps & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return (
    <Link href={href} className={buttonClassName(variant, size, className)} {...props}>
      {children}
    </Link>
  );
}
