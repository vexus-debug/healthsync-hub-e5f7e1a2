import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Microscope, Plus, Trash2 } from "lucide-react";
import {
  ANTIBIOTICS, ORGANISMS, CULTURE_SPECIMENS, AstData, AstIsolate, cycleSusceptibility, Susceptibility,
} from "@/lib/bench";

const chipClass: Record<Susceptibility, string> = {
  S: "bg-primary text-primary-foreground border-primary",
  I: "bg-secondary text-secondary-foreground border-border",
  R: "bg-destructive text-destructive-foreground border-destructive",
};

export const AntibiogramPanel = ({ data, onChange, disabled }: { data: AstData; onChange: (d: AstData) => void; disabled?: boolean }) => {
  const updIso = (i: number, patch: Partial<AstIsolate>) =>
    onChange({ ...data, isolates: data.isolates.map((x, j) => (j === i ? { ...x, ...patch } : x)) });

  return (
    <Card className="border-border/60 shadow-soft mb-5">
      <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Microscope className="h-4 w-4 text-primary" /> Culture &amp; Sensitivity (Antibiogram)</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Specimen</Label>
            <Select value={data.specimen} onValueChange={(v) => onChange({ ...data, specimen: v })} disabled={disabled}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Select specimen…" /></SelectTrigger>
              <SelectContent>{CULTURE_SPECIMENS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Culture outcome</Label>
            <Select value={data.growth} onValueChange={(v) => onChange({ ...data, growth: v as AstData["growth"] })} disabled={disabled}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Select…" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="growth">Significant growth</SelectItem>
                <SelectItem value="no_growth">No significant growth</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {data.growth === "growth" && (
          <>
            {data.isolates.map((iso, i) => (
              <div key={i} className="rounded-xl border border-border p-3 space-y-3">
                <div className="grid sm:grid-cols-[1fr_1fr_auto] gap-2 items-end">
                  <div className="space-y-1">
                    <Label className="text-xs">Isolate {i + 1}</Label>
                    <Select value={iso.organism} onValueChange={(v) => updIso(i, { organism: v })} disabled={disabled}>
                      <SelectTrigger className="h-9"><SelectValue placeholder="Organism…" /></SelectTrigger>
                      <SelectContent>{ORGANISMS.map((o) => <SelectItem key={o} value={o}><i>{o}</i></SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Colony count</Label>
                    <Input value={iso.colonyCount} onChange={(e) => updIso(i, { colonyCount: e.target.value })} placeholder=">10⁵ CFU/mL" className="h-9" disabled={disabled} />
                  </div>
                  <Button variant="ghost" size="icon" disabled={disabled} onClick={() => onChange({ ...data, isolates: data.isolates.filter((_, j) => j !== i) })}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground">Tap a drug to cycle S → I → R → clear</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {ANTIBIOTICS.map((ab) => {
                    const cur = iso.results[ab];
                    return (
                      <button
                        key={ab}
                        type="button"
                        disabled={disabled}
                        onClick={() => {
                          const next = cycleSusceptibility(cur);
                          const results = { ...iso.results };
                          if (next) results[ab] = next; else delete results[ab];
                          updIso(i, { results });
                        }}
                        className={`flex items-center justify-between gap-1 rounded-md border px-2 py-1 text-[11px] text-left transition ${cur ? chipClass[cur] : "bg-background border-border hover:bg-muted"}`}
                      >
                        <span className="truncate">{ab}</span>
                        <span className="font-bold w-3 text-center">{cur ?? ""}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" disabled={disabled || data.isolates.length >= 3}
              onClick={() => onChange({ ...data, isolates: [...data.isolates, { organism: "", colonyCount: "", results: {} }] })}>
              <Plus className="h-4 w-4" /> Add isolate
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};
