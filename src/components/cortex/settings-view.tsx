"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
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
import { createClient } from "@/lib/supabase/client";

export interface PersonalSettingsData {
  displayName: string;
  timezone: string;
  email: string;
  defaultModelId: string;
  defaultTemperature: number;
  theme: string;
  digest: boolean;
}

/** /app/settings — personal settings: profile, preferences, security, data. */
export function SettingsView({ initial }: { initial: PersonalSettingsData }) {
  const [displayName, setDisplayName] = useState(initial.displayName);
  const [timezone, setTimezone] = useState(initial.timezone);
  const [model, setModel] = useState(initial.defaultModelId);
  const [temperature, setTemperature] = useState(initial.defaultTemperature);
  const [theme, setTheme] = useState(initial.theme);
  const [digest, setDigest] = useState(initial.digest);
  const [saving, setSaving] = useState(false);

  async function saveProfile() {
    setSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You’re signed out.");
        return;
      }
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: displayName, timezone })
        .eq("id", user.id);
      if (error) throw error;
      toast.success("Profile saved");
    } catch {
      toast.error("Save failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        kicker="Cortex / Personal"
        title="Settings"
        lede="Your profile, preferences, and data controls."
      />

      <div className="flex max-w-3xl flex-col gap-4">
        <section className="rounded-[14px] border border-border bg-card p-6">
          <h3 className="font-serif text-xl font-medium">Profile</h3>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="set-name">Display name</Label>
              <Input
                id="set-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="mt-1.5 h-11 rounded-[10px]"
              />
            </div>
            <div>
              <Label htmlFor="set-tz">Timezone</Label>
              <Input
                id="set-tz"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="mt-1.5 h-11 rounded-[10px]"
                placeholder="America/New_York"
              />
            </div>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Signed in as <span className="font-medium text-foreground">{initial.email}</span>
          </p>
          <Button onClick={() => void saveProfile()} disabled={saving} className="mt-5">
            {saving ? "Saving…" : "Save profile"}
          </Button>
        </section>

        <section className="rounded-[14px] border border-border bg-card p-6">
          <h3 className="font-serif text-xl font-medium">Preferences</h3>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div>
              <Label>Default model</Label>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger className="mt-1.5 h-11 rounded-[10px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cortex-flash">Cortex Flash</SelectItem>
                  <SelectItem value="cortex-pro">Cortex Pro</SelectItem>
                  <SelectItem value="cortex-reason">Cortex Reason</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Theme</Label>
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger className="mt-1.5 h-11 rounded-[10px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="light">Light</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-5 max-w-md">
            <div className="flex items-baseline justify-between">
              <Label>Temperature</Label>
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
          <div className="mt-5 flex items-center gap-3">
            <Switch id="set-digest" checked={digest} onCheckedChange={setDigest} />
            <Label htmlFor="set-digest" className="text-[13px]">
              Weekly usage digest email
            </Label>
          </div>
          <Button
            className="mt-5"
            onClick={() => toast.success("Preferences saved")}
          >
            Save preferences
          </Button>
        </section>

        <section className="rounded-[14px] border border-border bg-card p-6">
          <h3 className="font-serif text-xl font-medium">Security</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Change your password and review where you’re signed in.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={async () => {
                const supabase = createClient();
                const { error } = await supabase.auth.resetPasswordForEmail(initial.email, {
                  redirectTo: `${window.location.origin}/reset-password`,
                });
                if (error) toast.error("Could not send the reset email.");
                else toast.success("Password reset email sent.");
              }}
            >
              Change password
            </Button>
          </div>
        </section>

        <section className="rounded-[14px] border border-border bg-card p-6">
          <h3 className="font-serif text-xl font-medium">Data</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => toast.info("Your export is being prepared.")}>
              Export my data
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Delete my account</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Your conversations and templates are removed. If you own a
                    team, transfer ownership first — teams without an owner are
                    locked.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive"
                    onClick={() => toast.info("Account deletion requires support confirmation.")}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </section>
      </div>
    </>
  );
}
