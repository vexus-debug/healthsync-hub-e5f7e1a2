import JsBarcode from "jsbarcode";
import QRCode from "qrcode";
import { tubeFor } from "@/lib/specimen";

export type LabelForm = { serial: string; patient_name: string; age: number; gender: string; tests_requested: string[]; collected_at?: string | null };

/** Opens a print window with specimen tube labels. Returns false if pop-ups are blocked. */
export async function printSpecimenLabels(form: LabelForm, copies = 1, format: "thermal" | "sheet" = "thermal"): Promise<boolean> {
  const w = window.open("", "_blank", "width=420,height=600");
  if (!w) return false;
  const tubes = Array.from(new Map(form.tests_requested.map((t) => { const x = tubeFor(t); return [x.tube, x]; })).values());
  if (!tubes.length) tubes.push(tubeFor(""));
  const css = getComputedStyle(document.documentElement);
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  JsBarcode(svg, form.serial, { format: "CODE128", height: 34, width: 1.4, fontSize: 10, margin: 0 });
  const bar = new XMLSerializer().serializeToString(svg);
  const qr = await QRCode.toDataURL(form.serial, { margin: 0, width: 80 });
  const date = new Date(form.collected_at ?? Date.now()).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
  const one = (t: { tube: string; colorVar: string }) => `
    <div class="lbl"><div class="sw" style="background:hsl(${css.getPropertyValue(t.colorVar)})"></div>
    <div class="b"><div class="n">${form.patient_name.replace(/</g, "&lt;")}</div>
    <div class="m">${form.age}y · ${form.gender} · ${t.tube}</div>${bar}<div class="m">${date}</div></div>
    <img src="${qr}" class="qr"/></div>`;
  const labels = tubes.flatMap((t) => Array(copies).fill(one(t))).join("");
  const page = format === "thermal"
    ? "@page{size:50mm 25mm;margin:0}.lbl{width:50mm;height:25mm;page-break-after:always}"
    : "@page{size:A4;margin:10mm}.wrap{display:grid;grid-template-columns:repeat(3,63.5mm);gap:2mm}.lbl{width:63.5mm;height:33.9mm;border:1px dashed #ccc}";
  w.document.write(`<html><head><title>${form.serial} labels</title><style>
    body{margin:0;font-family:Arial,sans-serif}${page}
    .lbl{box-sizing:border-box;display:flex;align-items:center;gap:1mm;padding:1mm;overflow:hidden}
    .sw{width:3mm;align-self:stretch;border-radius:1mm}.b{flex:1;min-width:0}.b svg{width:100%;height:auto;max-height:12mm}
    .n{font-weight:700;font-size:8pt;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.m{font-size:6pt}.qr{width:11mm;height:11mm}
    </style></head><body><div class="wrap">${labels}</div><script>onload=()=>{print()}</script></body></html>`);
  w.document.close();
  return true;
}
