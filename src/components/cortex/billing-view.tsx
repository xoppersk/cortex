"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/cortex/states";
import { StatusBadge } from "@/components/cortex/badges";
import { BudgetProgress } from "@/components/cortex/kpi";
import { GOVERNANCE, SCREEN_COPY } from "@/lib/cortex/truth";

export interface BillingData {
  plan: string;
  pricePerSeat: string;
  renewalDate: string;
  seats: number;
  seatLimit: number;
  isOwner: boolean;
}

const PRICE_PER_SEAT: Record<string, number> = { starter: 0, pro: 24, team: 49 };

/** /app/billing — plan card, seat stepper with proration, invoices. */
export function BillingView({ initial }: { initial: BillingData }) {
  const [seats, setSeats] = useState(initial.seats);
  const [confirming, setConfirming] = useState(false);
  const price = PRICE_PER_SEAT[initial.plan] ?? 24;
  const delta = seats - initial.seats;
  const prorated = Math.max(0, delta) * price;

  async function applySeats() {
    setConfirming(true);
    try {
      const res = await fetch("/api/team", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ seatCount: seats }),
      });
      if (!res.ok) {
        toast.error("Could not update seats.");
        return;
      }
      toast.success(`Seats updated to ${seats}`);
    } catch {
      toast.error("Could not update seats.");
    } finally {
      setConfirming(false);
    }
  }

  return (
    <>
      <PageHeader
        kicker="Cortex / Administration"
        title="Billing"
        lede={SCREEN_COPY["Billing"]}
        actions={!initial.isOwner ? undefined : <Button variant="outline">Manage payment method</Button>}
      />

      {!initial.isOwner && (
        <div className="mb-6 rounded-[14px] border border-info/40 bg-info/5 p-5 text-sm">
          You’re viewing billing as a member. Contact your workspace owner to
          change the plan or seats.
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-[14px] border border-border bg-card p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                Current plan
              </p>
              <h3 className="mt-1 font-serif text-2xl font-medium capitalize">{initial.plan}</h3>
            </div>
            <StatusBadge tone="primary">Active</StatusBadge>
          </div>
          <dl className="mt-5 flex flex-col gap-2.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Price per seat</dt>
              <dd className="font-mono">{initial.pricePerSeat}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Seats</dt>
              <dd className="font-mono tabular-nums">{initial.seats} of {initial.seatLimit}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Renews</dt>
              <dd className="font-mono">{initial.renewalDate}</dd>
            </div>
          </dl>
          <div className="mt-5">
            <BudgetProgress
              spent={GOVERNANCE.monthlySpent}
              limit={GOVERNANCE.monthlyLimit}
              label="Usage vs included"
              compact
            />
          </div>
        </div>

        <div className="rounded-[14px] border border-border bg-card p-6">
          <h3 className="font-serif text-xl font-medium">Seats</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Proration is shown exactly before you confirm.
          </p>
          <div className="mt-5 flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              disabled={!initial.isOwner || seats <= 1}
              onClick={() => setSeats((s) => Math.max(1, s - 1))}
              aria-label="Remove a seat"
            >
              −
            </Button>
            <span className="min-w-[64px] text-center font-mono text-xl tabular-nums">{seats}</span>
            <Button
              variant="outline"
              size="icon"
              disabled={!initial.isOwner}
              onClick={() => setSeats((s) => s + 1)}
              aria-label="Add a seat"
            >
              +
            </Button>
          </div>
          {delta !== 0 && initial.isOwner && (
            <div className="mt-5 rounded-xl border border-border p-4">
              <p className="font-mono text-[12px] text-muted-foreground">Proration preview</p>
              <p className="mt-1 text-[14px]">
                {delta > 0 ? `Add ${delta} seat${delta === 1 ? "" : "s"}` : `Remove ${-delta} seat${delta === -1 ? "" : "s"}`} —{" "}
                <b className="font-mono">${prorated.toFixed(2)} due today</b>
              </p>
              <Button className="mt-3" onClick={() => void applySeats()} disabled={confirming}>
                {confirming ? "Confirming…" : `Confirm — $${prorated.toFixed(2)}`}
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="section-rule">
        <h4>Invoices</h4>
        <span>PDF available per row</span>
      </div>
      <div className="rounded-[14px] border border-border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Invoices appear here after your first billing event.
        </p>
      </div>
    </>
  );
}
