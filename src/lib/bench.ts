// Clinical bench tools: critical values, antibiogram (AST), canned comment macros.
export const AST_KEY = "__ast";
export const REMARKS_KEY = "__remarks";
export const CRITICAL_KEY = "__critical";

export type CriticalRule = { match: RegExp; label: string; unit: string; low?: number; high?: number };

// Thresholds in the lab's reporting units (mmol/L, x10⁹/L).
export const CRITICAL_RULES: CriticalRule[] = [
  { match: /potassium|^k$/i, label: "Potassium", unit: "mmol/L", low: 2.8, high: 6.2 },
  { match: /glucose|fbs|rbs|blood sugar/i, label: "Glucose", unit: "mmol/L", low: 2.5, high: 25 },
  { match: /platelet|^plt$/i, label: "Platelets", unit: "x10⁹/L", low: 20 },
  { match: /sodium|^na$/i, label: "Sodium", unit: "mmol/L", low: 120, high: 160 },
  { match: /^hb$|haemoglobin|hemoglobin/i, label: "Haemoglobin", unit: "g/dL", low: 6 },
];

export type CriticalHit = { key: string; label: string; value: number; unit: string; direction: "LOW" | "HIGH" };

export const findCriticalValues = (
  values: Record<string, string>,
  labels: Record<string, string> = {},
): CriticalHit[] => {
  const hits: CriticalHit[] = [];
  for (const [key, raw] of Object.entries(values)) {
    if (key.startsWith("__") || !raw) continue;
    const v = parseFloat(String(raw).replace(/,/g, ""));
    if (isNaN(v)) continue;
    const name = labels[key] ?? key;
    const rule = CRITICAL_RULES.find((r) => r.match.test(key) || r.match.test(name));
    if (!rule) continue;
    if (rule.low !== undefined && v < rule.low) hits.push({ key, label: name, value: v, unit: rule.unit, direction: "LOW" });
    else if (rule.high !== undefined && v > rule.high) hits.push({ key, label: name, value: v, unit: rule.unit, direction: "HIGH" });
  }
  return hits;
};

export type CriticalNotice = { physician: string; phone: string; at: string; readBack: boolean; by?: string };

export const isNoticeComplete = (n: Partial<CriticalNotice> | null | undefined) =>
  !!n && !!n.physician?.trim() && !!n.phone?.trim() && !!n.at && n.readBack === true;

// ---------- Antibiogram ----------
export const CULTURE_SPECIMENS = ["Urine", "Wound", "Stool", "Sputum", "Swab", "Blood", "HVS"];
export const ORGANISMS = [
  "Escherichia coli", "Klebsiella pneumoniae", "Staphylococcus aureus", "Pseudomonas aeruginosa",
  "Proteus mirabilis", "Enterococcus faecalis", "Streptococcus pyogenes", "Salmonella typhi",
  "Candida albicans", "Coliforms",
];
export const ANTIBIOTICS = [
  "Amoxicillin-Clavulanate", "Ampicillin", "Ceftriaxone", "Cefuroxime", "Ceftazidime", "Ciprofloxacin",
  "Levofloxacin", "Ofloxacin", "Gentamicin", "Amikacin", "Nitrofurantoin", "Cotrimoxazole",
  "Azithromycin", "Erythromycin", "Imipenem", "Meropenem", "Vancomycin", "Clindamycin",
];
export type Susceptibility = "S" | "I" | "R";
export type AstIsolate = { organism: string; colonyCount: string; results: Record<string, Susceptibility> };
export type AstData = { specimen: string; growth: "growth" | "no_growth" | ""; isolates: AstIsolate[] };

export const emptyAst = (): AstData => ({ specimen: "", growth: "", isolates: [] });

export const parseAst = (raw?: string): AstData => {
  if (!raw) return emptyAst();
  try {
    const p = JSON.parse(raw);
    return { specimen: p.specimen ?? "", growth: p.growth ?? "", isolates: Array.isArray(p.isolates) ? p.isolates : [] };
  } catch { return emptyAst(); }
};

export const cycleSusceptibility = (cur?: Susceptibility): Susceptibility | undefined =>
  cur === undefined ? "S" : cur === "S" ? "I" : cur === "I" ? "R" : undefined;

// ---------- Canned comments ----------
export type CannedComment = { id: string; shortcut: string; title: string; body: string };

/** Replace any `.shortcut` token (followed by space/end) with its full text. */
export const expandMacros = (text: string, comments: CannedComment[]): string => {
  if (!text.includes(".")) return text;
  return text.replace(/(^|\s)(\.[a-z0-9_]+)(?=\s|$)/gi, (m, pre, tok) => {
    const c = comments.find((x) => x.shortcut.toLowerCase() === tok.toLowerCase());
    return c ? pre + c.body : m;
  });
};
