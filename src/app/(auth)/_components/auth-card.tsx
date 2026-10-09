import Link from "next/link";
import type { ReactNode } from "react";

import { CortexBrand } from "@/components/cortex/cortex-mark";

/**
 * Centered card shell shared by every auth page — nocturnal editorial.
 * Pages supply the title/description/footer; the form is a client component.
 */
export function AuthCard({
  title,
  description,
  footer,
  children,
}: {
  title: string;
  description: string;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-8 bg-background p-4">
      <Link href="/" aria-label="Cortex home">
        <CortexBrand />
      </Link>
      <div className="w-full max-w-[400px] rounded-[14px] border border-border bg-card p-8">
        <h1 className="font-serif text-[26px] font-medium tracking-[-0.02em]">{title}</h1>
        <p className="mt-1.5 text-[14px] text-muted-foreground">{description}</p>
        <div className="mt-6">{children}</div>
        {footer ? <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div> : null}
      </div>
    </div>
  );
}
