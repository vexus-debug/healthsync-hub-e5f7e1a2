export const SPECIMEN_STAGES = ["Registered", "Sample Collected", "Received at Bench", "In Analysis", "Completed"] as const;
export type SpecimenStage = (typeof SPECIMEN_STAGES)[number] | "Rejected";

export const REJECTION_CODES = [
  "Hemolyzed sample",
  "Clotted specimen",
  "QNS (quantity not sufficient)",
  "Wrong tube / incompatible additive",
  "Mislabeled or unlabeled tube",
  "Lipemic / icteric sample",
  "Transit delay / temperature breach",
] as const;

export function nextStage(s: string): SpecimenStage | null {
  if (s === "Rejected") return "Sample Collected";
  const i = SPECIMEN_STAGES.indexOf(s as (typeof SPECIMEN_STAGES)[number]);
  if (i < 0 || i >= SPECIMEN_STAGES.length - 2) return null; // Completed is set by result sign-off
  return SPECIMEN_STAGES[i + 1];
}

export type TubeInfo = { tube: string; colorVar: string };
export function tubeFor(test: string): TubeInfo {
  const t = test.toLowerCase();
  if (/fbc|cbc|blood count|hb|pcv|esr|genotype|blood group|hba1c|malaria|mp/.test(t)) return { tube: "EDTA", colorVar: "--tube-edta" };
  if (/pt|inr|aptt|coag|citrate/.test(t)) return { tube: "Citrate", colorVar: "--tube-citrate" };
  if (/glucose|fbs|rbs|ogtt|sugar/.test(t)) return { tube: "Fluoride", colorVar: "--tube-fluoride" };
  if (/urine|stool|swab|sputum|semen|hvs|culture/.test(t)) return { tube: "Sterile container", colorVar: "--tube-sterile" };
  return { tube: "Plain / Serum", colorVar: "--tube-plain" };
}
