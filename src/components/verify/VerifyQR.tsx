import { useEffect, useState } from "react";
import QRCode from "qrcode";

export const verifyUrlFor = (serial: string) => {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/results?serial=${encodeURIComponent(serial)}`;
};

/** Verification QR stamped on reports; scanning opens the public verification page. */
export const VerifyQR = ({ serial, size = 72 }: { serial: string; size?: number }) => {
  const [src, setSrc] = useState<string>("");
  useEffect(() => {
    QRCode.toDataURL(verifyUrlFor(serial), { margin: 0, width: size * 3 }).then(setSrc).catch(() => setSrc(""));
  }, [serial, size]);
  if (!src) return null;
  return (
    <div className="flex items-center gap-2">
      <img src={src} alt={`Verify ${serial}`} width={size} height={size} />
      <div className="text-[9px] leading-tight text-slate-500 max-w-[110px]">
        Scan to verify this document. Serial <span className="font-semibold text-slate-800">{serial}</span>
      </div>
    </div>
  );
};
