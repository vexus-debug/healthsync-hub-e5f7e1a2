import { useState } from "react";
import { printSpecimenLabels } from "@/lib/printLabels";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Barcode, Check, FlaskConical, XCircle, Printer } from "lucide-react";
import { SPECIMEN_STAGES, REJECTION_CODES, nextStage, tubeFor } from "@/lib/specimen";

type F = {
  id: string; serial: string; patient_name: string; age: number; gender: string; tests_requested: string[];
  specimen_status?: string | null; collected_at?: string | null; collected_by?: string | null;
  received_at?: string | null; specimen_rejection_code?: string | null; specimen_rejection_notes?: string | null;
  recollection_count?: number | null; status?: string | null;
};

export function SpecimenPanel({ form, staffName, userId }: { form: F; staffName: string; userId?: string }) {
  const qc = useQueryClient();
  const stage = form.status === "Completed" ? "Completed" : form.specimen_status ?? "Registered";
  const next = nextStage(stage);
  const [busy, setBusy] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [code, setCode] = useState<string>(REJECTION_CODES[0]);
  const [notes, setNotes] = useState("");
  const [collector, setCollector] = useState(staffName);
  const [labelOpen, setLabelOpen] = useState(false);
  const [copies, setCopies] = useState(1);
  const [format, setFormat] = useState<"thermal" | "sheet">("thermal");

  const log = (action: string, newValue: string, reason?: string) =>
    supabase.from("result_audit_log").insert({ form_id: form.id, serial: form.serial, action, new_value: newValue, reason: reason ?? null, changed_by: userId ?? null, changed_by_name: staffName });

  const advance = async () => {
    if (!next) return;
    setBusy(true);
    const now = new Date().toISOString();
    const patch: Record<string, unknown> = { specimen_status: next };
    if (next === "Sample Collected") { patch.collected_at = now; patch.collected_by = collector || staffName; }
    if (next === "Received at Bench") { patch.received_at = now; patch.received_by = staffName; }
    if (next === "In Analysis") { patch.analysis_started_at = now; patch.status = "Processing"; }
    const { error } = await supabase.from("test_forms").update(patch as never).eq("id", form.id);
    if (!error) await log("specimen_status", next);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(`Specimen marked: ${next}`);
    qc.invalidateQueries({ queryKey: ["test_form", form.serial] });
  };

  const reject = async () => {
    setBusy(true);
    const { error } = await supabase.from("test_forms").update({
      specimen_status: "Rejected", specimen_rejection_code: code, specimen_rejection_notes: notes || null,
      specimen_rejected_at: new Date().toISOString(), recollection_count: (form.recollection_count ?? 0) + 1,
    } as never).eq("id", form.id);
    if (!error) await log("specimen_rejected", code, notes);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.warning("Specimen rejected — recollection required");
    setRejectOpen(false); setNotes("");
    qc.invalidateQueries({ queryKey: ["test_form", form.serial] });
  };

  const printLabels = async () => {
    if (!(await printSpecimenLabels(form, copies, format))) return toast.error("Allow pop-ups to print labels");
    setLabelOpen(false);
  };

  const idx = SPECIMEN_STAGES.indexOf(stage as never);

  return (
    <Card className="mb-5 border-border/60 shadow-soft no-print">
      <CardHeader className="pb-3 flex flex-row items-center justify-between gap-2 flex-wrap">
        <CardTitle className="text-sm flex items-center gap-2 text-primary"><FlaskConical className="h-4 w-4" /> Specimen Tracking</CardTitle>
        <Button size="sm" variant="outline" onClick={() => setLabelOpen(true)}><Barcode className="h-4 w-4" /> Print Labels</Button>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="flex flex-wrap gap-1.5">
          {SPECIMEN_STAGES.map((s, i) => (
            <Badge key={s} variant={i <= idx ? "default" : "secondary"} className="font-normal gap-1">
              {i <= idx && <Check className="h-3 w-3" />}{s}
            </Badge>
          ))}
          {stage === "Rejected" && <Badge variant="destructive">Rejected</Badge>}
        </div>

        {stage === "Rejected" && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3">
            <p className="font-medium text-destructive">Recollection required: {form.specimen_rejection_code}</p>
            {form.specimen_rejection_notes && <p className="text-xs mt-1">{form.specimen_rejection_notes}</p>}
            <p className="text-xs text-muted-foreground mt-1">Rejections so far: {form.recollection_count ?? 0}</p>
          </div>
        )}

        <div className="text-xs text-muted-foreground grid sm:grid-cols-2 gap-1">
          {form.collected_at && <span>Collected {new Date(form.collected_at).toLocaleString()} by {form.collected_by ?? "—"}</span>}
          {form.received_at && <span>Received at bench {new Date(form.received_at).toLocaleString()}</span>}
        </div>

        {stage !== "Completed" && (
          <div className="flex flex-wrap items-end gap-2">
            {next === "Sample Collected" && (
              <div className="space-y-1"><Label className="text-xs">Collected by</Label>
                <Input className="h-9 w-48" value={collector} onChange={(e) => setCollector(e.target.value)} /></div>
            )}
            {next && <Button size="sm" disabled={busy} onClick={advance}>Mark as {next}</Button>}
            {stage !== "Registered" && stage !== "Rejected" && (
              <Button size="sm" variant="destructive" disabled={busy} onClick={() => setRejectOpen(true)}><XCircle className="h-4 w-4" /> Reject Specimen</Button>
            )}
          </div>
        )}
      </CardContent>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject specimen</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Reason</Label>
              <Select value={code} onValueChange={setCode}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{REJECTION_CODES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select></div>
            <div className="space-y-1"><Label>Notes / instructions</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Recollect in EDTA, avoid prolonged tourniquet" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button variant="destructive" disabled={busy} onClick={reject}>Reject & request recollection</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={labelOpen} onOpenChange={setLabelOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Print specimen labels</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Format</Label>
              <Select value={format} onValueChange={(v) => setFormat(v as "thermal" | "sheet")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="thermal">Thermal roll 50×25mm</SelectItem><SelectItem value="sheet">A4 label sheet</SelectItem></SelectContent>
              </Select></div>
            <div className="space-y-1"><Label>Copies per tube</Label>
              <Input type="number" min={1} max={10} value={copies} onChange={(e) => setCopies(Math.max(1, Math.min(10, +e.target.value || 1)))} /></div>
            <div className="flex flex-wrap gap-1.5">
              {Array.from(new Set(form.tests_requested.map((t) => tubeFor(t).tube))).map((t) => <Badge key={t} variant="secondary">{t}</Badge>)}
            </div>
          </div>
          <DialogFooter><Button onClick={printLabels}><Printer className="h-4 w-4" /> Print</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
