import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { CortexBrand } from "@/components/cortex/cortex-mark";

export const metadata: Metadata = { title: "Upgrade" };
// Reads ?reason= at request time — never prerender.
export const instant = false;

const PLANS = [
  {
    name: "Starter",
    price: "Free",
    features: ["3 seats", "100K tokens/mo", "1 knowledge base", "Community support"],
  },
  {
    name: "Pro",
    price: "$24 / seat / mo",
    features: ["10 seats", "1M tokens/mo", "Unlimited knowledge bases", "Eval command center", "Priority support"],
    popular: true,
  },
  {
    name: "Team",
    price: "$49 / seat / mo",
    features: ["Unlimited seats", "10M tokens/mo", "SSO / SCIM", "Retention controls", "Dedicated support"],
  },
];

/** /upgrade — over quota/budget explainer with plan comparison. */
export default async function UpgradePage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;
  const reasonCopy: Record<string, string> = {
    seats: "Your team reached its seat limit.",
    budget: "This workspace used its monthly model allowance.",
    tokens: "You hit the token budget for this period.",
  };

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-5xl flex-col items-center px-4 py-16">
      <CortexBrand className="mb-10" />
      <div className="w-full max-w-2xl rounded-[14px] border border-border bg-card p-8 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
          Limit reached
        </p>
        <h1 className="mt-3 font-serif text-3xl font-medium">
          {reason && reasonCopy[reason] ? reasonCopy[reason] : "You hit a workspace limit."}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-[15px] text-muted-foreground">
          Existing conversations and citations remain available. Upgrade to keep
          working — proration is shown exactly before you confirm.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button size="lg">Upgrade</Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/">Talk to us</Link>
          </Button>
        </div>
      </div>

      <div className="mt-10 grid w-full gap-4 sm:grid-cols-3">
        {PLANS.map((p) => (
          <div
            key={p.name}
            className={
              p.popular
                ? "rounded-[14px] border-2 border-primary bg-card p-6"
                : "rounded-[14px] border border-border bg-card p-6"
            }
          >
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-xl font-medium">{p.name}</h3>
              {p.popular && (
                <span className="rounded-full bg-primary-muted px-2.5 py-1 font-mono text-[10px] text-primary">
                  Most popular
                </span>
              )}
            </div>
            <p className="mt-1 font-mono text-[13px] text-muted-foreground">{p.price}</p>
            <ul className="mt-4 flex flex-col gap-2 text-sm text-muted-foreground">
              {p.features.map((f) => (
                <li key={f}>· {f}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
