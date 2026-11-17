import { SITE } from "@/lib/site";
import { VerifyQR } from "./VerifyQR";

export interface PublicScan {
  serial: string; patient_name: string; mrn: string; age: number | null; gender: string | null;
  scan_type: string; modality: string | null; body_part: string | null; scan_date: string; status: string;
  clinical_indication: string | null; referring_doctor: string | null; findings: string | null;
  impression: string | null; recommendation: string | null; report_text: string | null;
  reported_at: string | null; approved_at: string | null;
}

const Block = ({ title, text }: { title: string; text: string | null }) =>
  text ? (
    <section className="mb-4">
      <h4 className="font-semibold text-primary uppercase text-[11px] tracking-wider mb-1">{title}</h4>
      <p className="whitespace-pre-wrap">{text}</p>
    </section>
  ) : null;

export const ScanReportView = ({ scan }: { scan: PublicScan }) => (
  <div className="bg-white text-slate-900 rounded-xl border border-border shadow-soft overflow-hidden text-[13px] print-report">
    <div className="px-6 py-4 border-b-2 border-primary/40">
      <h3 className="font-display font-bold text-lg text-primary">{SITE.fullName}</h3>
      <p className="text-xs text-slate-500">Ultrasound / Imaging Report</p>
    </div>
    <div className="px-6 py-4 grid grid-cols-2 gap-2 text-[12px] border-b border-slate-200">
      <span>Patient: <b>{scan.patient_name}</b></span>
      <span>Serial: <b>{scan.serial}</b></span>
      <span>Age/Gender: {scan.age ?? "—"} / {scan.gender ?? "—"}</span>
      <span>MRN: {scan.mrn}</span>
      <span>Exam: {scan.scan_type}{scan.body_part ? ` — ${scan.body_part}` : ""}</span>
      <span>Date: {new Date(scan.scan_date).toLocaleDateString()}</span>
      <span>Referred by: {scan.referring_doctor ?? "—"}</span>
      <span>Status: {scan.status}</span>
    </div>
    <div className="px-6 py-4">
      <Block title="Clinical indication" text={scan.clinical_indication} />
      <Block title="Findings" text={scan.findings} />
      <Block title="Report" text={scan.report_text} />
      <Block title="Impression" text={scan.impression} />
      <Block title="Recommendation" text={scan.recommendation} />
    </div>
    <div className="px-6 py-3 border-t-2 border-primary/40 bg-slate-50 flex justify-between items-center text-[10px] text-slate-600">
      <span>{SITE.address}</span>
      <VerifyQR serial={scan.serial} />
    </div>
  </div>
);
