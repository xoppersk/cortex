"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { PageHeader } from "@/components/cortex/states";
import { BudgetProgress } from "@/components/cortex/kpi";
import { GOVERNANCE } from "@/lib/cortex/truth";

export interface TeamSettingsData {
  name: string;
  plan: string;
  defaultModelId: string;
  defaultTemperature: number;
  fallbackModelId: string;
  monthlyTokenBudget: number | null;
  budgetHardStop: boolean;
  retentionDays: 30 | 90 | 365;
  isOwner: boolean;
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[14px] border border-border bg-card p-6">
      <h3 className="font-serif text-xl font-medium">{title}</h3>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function SaveRow({ saving, onSave }: { saving: boolean; onSave: () => void }) {
  return (
    <Button onClick={onSave} disabled={saving} className="mt-5">
      {saving ? "Saving…" : "Save changes"}
    </Button>
  );
}

/** /app/team/settings — workspace governance (owner/admin). */
export function TeamSettingsView({ initial }: { initial: TeamSettingsData }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(initial.name);
  const [defaultModel, setDefaultModel] = useState(initial.defaultModelId);
  const [temperature, setTemperature] = useState(initial.defaultTemperature);
  const [fallback, setFallback] = useState(initial.fallbackModelId);
  const [budget, setBudget] = useState(
    initial.monthlyTokenBudget === null ? "" : String(initial.monthlyTokenBudget),
  );
  const [hardStop, setHardStop] = useState(initial.budgetHardStop);
  const [retention, setRetention] = useState(String(initial.retentionDays));

  async function patch(body: Record<string, unknown>) {
    setSaving(true);
    try {
      const res = await fetch("/api/team", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        toast.error(err?.message ?? "Save failed.");
        return;
      }
      toast.success("Workspace settings saved");
      router.refresh();
    } catch {
      toast.error("Save failed.");
    } finally {
      setSaving(false);
    }
  }

  const models = [
    { id: "cortex-flash", label: "Cortex Flash — fast, cheapest" },
    { id: "cortex-pro", label: "Cortex Pro — balanced" },
    { id: "cortex-reason", label: "Cortex Reason — deep reasoning" },
  ];

  return (
    <>
      <PageHeader
        kicker="Cortex / Administration"
        title="Workspace settings"
        lede="Defaults, budgets, and data governance for the whole team."
      />

      <div className="flex max-w-3xl flex-col gap-4">
        <Section title="Workspace">
          <div>
            <Label htmlFor="ws-name">Workspace name</Label>
            <Input
              id="ws-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5 h-11 max-w-md rounded-[10px]"
            />
          </div>
          <SaveRow saving={saving} onSave={() => void patch({ name })} />
        </Section>

        <Section title="Defaults">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label>Default model</Label>
              <Select value={defaultModel} onValueChange={setDefaultModel}>
                <SelectTrigger className="mt-1.5 h-11 rounded-[10px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {models.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Fallback model</Label>
              <Select value={fallback} onValueChange={setFallback}>
                <SelectTrigger className="mt-1.5 h-11 rounded-[10px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {models.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-5 max-w-md">
            <div className="flex items-baseline justify-between">
              <Label>Default temperature</Label>
              <span className="font-mono text-[12px]">{temperature.toFixed(2)}</span>
            </div>
            <Slider
              value={[temperature]}
              onValueChange={([v]) => setTemperature(v ?? 0.7)}
              min={0}
              max={2}
              step={0.05}
              className="mt-2"
              aria-label="Default temperature"
            />
          </div>
          <SaveRow
            saving={saving}
            onSave={() =>
              void patch({
                defaultModelId: defaultModel,
                defaultTemperature: temperature,
                fallbackModelId: fallback,
              })
            }
          />
        </Section>

        <Section title="Budgets">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="ws-budget">Monthly token budget (USD)</Label>
              <Input
                id="ws-budget"
                value={budget}
                onChange={(e) => setBudget(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="200"
                inputMode="numeric"
                className="mt-1.5 h-11 rounded-[10px]"
              />
            </div>
            <div className="flex items-end gap-3 pb-1">
              <Switch
                id="ws-hardstop"
                checked={hardStop}
                onCheckedChange={setHardStop}
                aria-label="Hard stop at 100%"
              />
              <Label htmlFor="ws-hardstop" className="text-[13px]">
                Hard-stop sends at 100% (otherwise alert-only)
              </Label>
            </div>
          </div>
          <div className="mt-5">
            <BudgetProgress
              spent={GOVERNANCE.monthlySpent}
              limit={budget ? parseInt(budget, 10) : GOVERNANCE.monthlyLimit}
              hardStop={hardStop}
            />
          </div>
          <SaveRow
            saving={saving}
            onSave={() =>
              void patch({
                monthlyTokenBudget: budget === "" ? null : parseInt(budget, 10),
                budgetHardStop: hardStop,
              })
            }
          />
        </Section>

        <Section title="Data">
          <div className="max-w-md">
            <Label>Conversation retention</Label>
            <Select value={retention} onValueChange={setRetention}>
              <SelectTrigger className="mt-1.5 h-11 rounded-[10px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
                <SelectItem value="365">365 days</SelectItem>
              </SelectContent>
            </Select>
            <p className="mt-2 text-[13px] text-muted-foreground">
              Changing this purges history older than the window on the next
              nightly run.
            </p>
          </div>
          <SaveRow saving={saving} onSave={() => void patch({ retentionDays: retention })} />
        </Section>

        {initial.isOwner && (
          <section className="rounded-[14px] border border-destructive/40 p-6">
            <h3 className="font-serif text-xl font-medium text-destructive">Delete team</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              This permanently removes the workspace, every conversation,
              knowledge base, and API key. This cannot be undone.
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="mt-4">
                  Delete team
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this team?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Type the workspace name to confirm. All data is removed
                    permanently.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive"
                    onClick={() => toast.info("Team deletion requires support confirmation.")}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </section>
        )}
      </div>
    </>
  );
}
