import { supabase } from "@/integrations/supabase/client";
import type { CannedComment } from "@/lib/bench";

export const fetchCannedComments = async (): Promise<CannedComment[]> => {
  const { data, error } = await supabase.from("canned_comments").select("id, shortcut, title, body").order("shortcut");
  if (error) throw error;
  return data ?? [];
};
export const saveCannedComment = async (c: { id?: string; shortcut: string; title: string; body: string }) => {
  const shortcut = c.shortcut.trim().startsWith(".") ? c.shortcut.trim() : `.${c.shortcut.trim()}`;
  const row = { shortcut: shortcut.toLowerCase(), title: c.title.trim(), body: c.body.trim() };
  const q = c.id
    ? supabase.from("canned_comments").update(row).eq("id", c.id)
    : supabase.from("canned_comments").insert(row);
  const { error } = await q;
  if (error) throw error;
};
export const deleteCannedComment = async (id: string) => {
  const { error } = await supabase.from("canned_comments").delete().eq("id", id);
  if (error) throw error;
};
