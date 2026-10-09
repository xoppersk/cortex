"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/cortex/states";
import { VariablePill } from "@/components/cortex/prompt-kit";

export interface BuilderInitial {
  id?: string;
  name: string;
  description: string;
  category: string;
  promptBody: string;
  variables: { name: string; defaultValue: string; required: boolean }[];
  visibility: "personal" | "team";
  version?: number;
  runCount?: number;
}

const EMPTY: BuilderInitial = {
  name: "",
  description: "",
  category: "Marketing",
  promptBody: "",
  variables: [],
  visibility: "personal",
};

function extractVariables(body: string): string[] {
  const found = new Set<string>();
  const re = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) {
    if (m[1]) found.add(m[1]);
  }
  return [...found];
}

/** Two-pane builder: form left, live fill-in preview right. */
export function TemplateBuilder({ initial }: { initial?: BuilderInitial }) {
  const router = useRouter();
  const [form, setForm] = useState<BuilderInitial>(initial ?? EMPTY);
  const [saving, setSaving] = useState(false);
  const [previewValues, setPreviewValues] = useState<Record<string, string>>({});

  const varNames = useMemo(() => extractVariables(form.promptBody), [form.promptBody]);
  const unclosed = useMemo(() => {
    const opens = (form.promptBody.match(/\{\{/g) ?? []).length;
    const closes = (form.promptBody.match(/\}\}/g) ?? []).length;
    return opens > closes;
  }, [form.promptBody]);

  function set<K extends keyof BuilderInitial>(key: K, value: BuilderInitial[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function insertVariable() {
    set("promptBody", form.promptBody + "{{topic}}");
  }

  function renderPreview(): string {
    let out = form.promptBody;
    for (const name of varNames) {
      const v = previewValues[name] ?? `‹${name}›`;
      out = out.replaceAll(`{{${name}}}`, v);
      out = out.replaceAll(`{{ ${name} }}`, v);
    }
    return out;
  }

  async function save() {
    if (unclosed) {
      toast.error("Unclosed {{variable}} in the prompt body.");
      return;
    }
    setSaving(true);
    try {
      const variables = varNames.map((name) => ({
        name,
        defaultValue:
          form.variables.find((v) => v.name === name)?.defaultValue ?? "",
        required: true,
      }));
      const method = initial?.id ? "PATCH" : "POST";
      const url = initial?.id ? `/api/templates/${initial.id}` : "/api/templates";
      const res = await fetch(url, {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...form, variables }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        toast.error(err?.message ?? "Save failed.");
        return;
      }
      toast.success("Template saved", { action: { label: "View", onClick: () => router.push("/app/templates") } });
      router.push("/app/templates");
      router.refresh();
    } catch {
      toast.error("Save failed — check your connection.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        kicker="Cortex / Workspace"
        title={initial?.id ? form.name || "Edit playbook" : "New playbook"}
        lede="Define instructions, variables, knowledge, quality checks, and sharing in one guided build sequence."
        actions={
          <>
            <Button variant="outline" onClick={() => router.back()}>
              Discard
            </Button>
            <Button onClick={() => void save()} disabled={saving}>
              {saving ? "Saving…" : initial?.id ? "Save changes" : "Save playbook"}
            </Button>
          </>
        }
      />

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Left: form */}
        <div className="flex flex-col gap-5">
          <div>
            <Label htmlFor="tpl-name">Name</Label>
            <Input
              id="tpl-name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Cold outreach v3"
              className="mt-1.5 h-11 rounded-[10px]"
            />
          </div>
          <div>
            <Label htmlFor="tpl-desc">Description</Label>
            <Textarea
              id="tpl-desc"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="What this playbook is for."
              className="mt-1.5 rounded-[10px]"
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => set("category", v)}>
                <SelectTrigger className="mt-1.5 h-11 rounded-[10px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Marketing", "Sales", "Engineering", "Ops", "Custom"].map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Visibility</Label>
              <div className="mt-1.5 flex gap-2" role="radiogroup" aria-label="Visibility">
                {(["personal", "team"] as const).map((v) => (
                  <button
                    key={v}
                    role="radio"
                    aria-checked={form.visibility === v}
                    onClick={() => set("visibility", v)}
                    className={
                      form.visibility === v
                        ? "flex-1 rounded-[10px] border border-primary bg-primary-muted px-3 py-2.5 text-[13px] font-medium capitalize text-primary"
                        : "flex-1 rounded-[10px] border border-border px-3 py-2.5 text-[13px] capitalize text-muted-foreground hover:text-foreground"
                    }
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="tpl-body">Prompt</Label>
              <Button variant="ghost" size="sm" onClick={insertVariable}>
                Insert variable
              </Button>
            </div>
            <Textarea
              id="tpl-body"
              value={form.promptBody}
              onChange={(e) => set("promptBody", e.target.value)}
              placeholder="Write the prompt. Mark variables like {{prospect}}, {{product}}, {{tone}}."
              className="mt-1.5 min-h-[220px] rounded-[10px] font-mono text-[13px]"
            />
            {unclosed && (
              <p className="mt-1.5 text-[13px] text-destructive">Unclosed {"{{variable}}"} — add the closing braces.</p>
            )}
            {varNames.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {varNames.map((v) => (
                  <VariablePill key={v} name={v} />
                ))}
              </div>
            )}
          </div>
          {initial?.id && (
            <p className="font-mono text-[11px] text-muted-foreground">
              Version {initial.version ?? 1} · {initial.runCount ?? 0} runs this month
            </p>
          )}
        </div>

        {/* Right: live fill-in preview, as a teammate sees it */}
        <div>
          <p className="cortex-nav-label !px-0">Live preview — as a teammate sees it</p>
          <div className="rounded-[14px] border border-border bg-card p-5">
            {varNames.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Insert a variable to see the fill-in form appear here.
              </p>
            ) : (
              <div className="flex flex-col gap-4">
                {varNames.map((name) => (
                  <div key={name}>
                    <Label>
                      <VariablePill name={name} />
                    </Label>
                    <Input
                      value={previewValues[name] ?? ""}
                      onChange={(e) =>
                        setPreviewValues((p) => ({ ...p, [name]: e.target.value }))
                      }
                      placeholder={`Value for ${name}`}
                      className="mt-1.5 h-11 rounded-[10px]"
                    />
                  </div>
                ))}
                <div className="border-t border-border pt-4">
                  <p className="cortex-nav-label !px-0">Prompt preview</p>
                  <p className="whitespace-pre-wrap text-[14px] leading-relaxed">
                    {renderPreview() || <span className="text-muted-foreground">—</span>}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
