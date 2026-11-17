import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Siren } from "lucide-react";
import { CriticalHit, CriticalNotice, isNoticeComplete } from "@/lib/bench";

const nowLocal = () => {
  const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

export const CriticalBanner = ({ hits, notice }: { hits: CriticalHit[]; notice: CriticalNotice | null }) => {
  if (hits.length === 0) return null;
  const done = isNoticeComplete(notice);
  return (
    <div className={`mb-5 rounded-xl border-2 p-4 ${done ? "border-primary/40 bg-primary-soft/30" : "border-destructive bg-destructive/10 animate-pulse"}`}>
      <p className={`font-bold text-sm flex items-center gap-2 ${done ? "text-primary" : "text-destructive"}`}>
        <Siren className="h-4 w-4" /> CRITICAL VALUE{hits.length > 1 ? "S" : ""} DETECTED
      </p>
      <ul className="mt-1 text-sm">
        {hits.map((h) => <li key={h.key}><b>{h.label}</b>: {h.value} {h.unit} — critically {h.direction}</li>)}
      </ul>
      <p className="text-xs mt-2 text-muted-foreground">
        {done ? `Physician ${notice!.physician} notified (${notice!.phone}) at ${new Date(notice!.at).toLocaleString()} — read-back confirmed.`
          : "A physician notification must be recorded before this result can be completed or approved."}
      </p>
    </div>
  );
};

export const CriticalValueDialog = ({
  open, onOpenChange, hits, initial, onSave,
}: {
  open: boolean; onOpenChange: (o: boolean) => void; hits: CriticalHit[]; initial: CriticalNotice | null;
  onSave: (n: CriticalNotice) => void;
}) => {
  const [n, setN] = useState<CriticalNotice>(initial ?? { physician: "", phone: "", at: nowLocal(), readBack: false });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-destructive flex items-center gap-2"><Siren className="h-5 w-5" /> Critical Value Notification</DialogTitle>
          <DialogDescription>
            {hits.map((h) => `${h.label} ${h.value} ${h.unit} (${h.direction})`).join(", ")}. Record who was notified.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div><Label>Physician / nurse notified</Label><Input value={n.physician} onChange={(e) => setN({ ...n, physician: e.target.value })} /></div>
          <div><Label>Phone number called</Label><Input value={n.phone} onChange={(e) => setN({ ...n, phone: e.target.value })} /></div>
          <div><Label>Time of call</Label><Input type="datetime-local" value={n.at} onChange={(e) => setN({ ...n, at: e.target.value })} /></div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={n.readBack} onCheckedChange={(c) => setN({ ...n, readBack: c === true })} />
            Recipient read back the value(s) correctly
          </label>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!isNoticeComplete(n)} onClick={() => onSave(n)}>Save notification</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
