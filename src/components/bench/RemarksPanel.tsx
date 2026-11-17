import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquareText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchCannedComments } from "@/lib/cannedComments";
import { expandMacros } from "@/lib/bench";

export const RemarksPanel = ({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled?: boolean }) => {
  const { data: comments = [] } = useQuery({ queryKey: ["canned_comments"], queryFn: fetchCannedComments });
  return (
    <Card className="border-border/60 shadow-soft mb-5">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-sm flex items-center gap-2"><MessageSquareText className="h-4 w-4 text-primary" /> Scientist&apos;s Remarks</CardTitle>
        <Select value="" onValueChange={(id) => {
          const c = comments.find((x) => x.id === id);
          if (c) onChange(value.trim() ? `${value.trim()}\n${c.body}` : c.body);
        }} disabled={disabled}>
          <SelectTrigger className="h-8 w-48 text-xs"><SelectValue placeholder="Insert canned comment…" /></SelectTrigger>
          <SelectContent>
            {comments.map((c) => <SelectItem key={c.id} value={c.id}><span className="font-mono text-xs mr-2">{c.shortcut}</span>{c.title}</SelectItem>)}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <Textarea
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(expandMacros(e.target.value, comments))}
          placeholder="Type remarks, or a shortcut like .uti followed by a space…"
          className="min-h-[90px] text-sm"
        />
      </CardContent>
    </Card>
  );
};
