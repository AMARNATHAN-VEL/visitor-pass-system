import { useEffect } from "react";
import {
  Building2,
  CalendarDays,
  Clock3,
  Mail,
  Printer,
  X,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

const VERIFY_BASE_URL =
  import.meta.env.VITE_PASS_VERIFY_URL || "https://yourdomain.com/verify-pass";

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "-";

const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "-";

const formatTime = (value) => {
  if (!value) return "-";
  const [hours, minutes] = value.split(":");
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
};

const getPassNumber = (visit) => {
  const year = visit.visitDate
    ? new Date(visit.visitDate).getFullYear()
    : new Date().getFullYear();
  const suffix = (visit.passCode || visit._id || "0000")
    .replace(/[^a-z0-9]/gi, "")
    .slice(-4)
    .toUpperCase()
    .padStart(4, "0");
  return `VP-${year}-${suffix}`;
};

const getStatus = (status) =>
  status === "CheckedOut" ? "CHECKED-OUT" : "CHECKED-IN";

const Detail = ({ label, value }) => (
  <div className="visitor-pass-detail">
    <dt>{label}</dt>
    <dd>{value || "-"}</dd>
  </div>
);

export default function VisitorPassModal({
  visit,
  onClose,
  companyName = "Visitor Services",
  companyLogo,
  receptionEmail = "reception@example.com",
  receptionPhone = "+1 (000) 000-0000",
}) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!visit) return null;

  const visitor = visit.visitorId || {};
  const host = visit.employeeId || visit.assignedEmployee || {};
  const passCode = visit.passCode || visit._id;
  const verificationUrl = `${VERIFY_BASE_URL.replace(/\/$/, "")}/${encodeURIComponent(passCode)}`;
  const status = getStatus(visit.status);

  return (
    <div
      className="visitor-pass-print-root fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="visitor-pass-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="visitor-pass-sheet relative w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="visitor-pass-print-actions absolute right-4 top-4 z-10 flex gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
          >
            <Printer className="h-4 w-4" />
            Print Pass
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white p-2 text-slate-600 hover:bg-slate-50"
            aria-label="Close visitor pass"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="visitor-pass-content p-7 sm:p-10">
          <header className="border-b-2 border-slate-900 pb-5 pr-28 sm:pr-36">
            <div className="flex items-start gap-4">
              {companyLogo ? (
                <img
                  src={companyLogo}
                  alt={`${companyName} logo`}
                  className="h-14 w-14 rounded-lg object-contain"
                />
              ) : (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white">
                  <Building2 className="h-7 w-7" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-bold tracking-[0.2em] text-indigo-700">
                  VISITOR PASS - TEMPLATE TASK
                </p>
                <h1
                  id="visitor-pass-title"
                  className="mt-1 text-2xl font-black tracking-tight text-slate-950"
                >
                  {companyName}
                </h1>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
              <p className="font-semibold text-slate-700">
                Pass No:{" "}
                <span className="font-mono text-slate-950">
                  {getPassNumber(visit)}
                </span>
              </p>
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-bold tracking-wide ${
                  status === "CHECKED-IN"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-slate-200 text-slate-700"
                }`}
              >
                {status}
              </span>
            </div>
          </header>

          <section className="mt-7">
            <h2 className="visitor-pass-section-title">Visitor Details</h2>
            <dl className="visitor-pass-details-grid mt-3">
              <Detail label="Visitor Name" value={visitor.name} />
              <Detail label="Mobile" value={visitor.phone} />
              <Detail label="Company / Organization" value={visit.company} />
              <Detail label="Purpose" value={visit.purpose} />
              <Detail label="Person to Meet" value={host.name} />
              <Detail
                label="Department"
                value={host.department || visit.targetDepartment}
              />
              <Detail label="Visit Date" value={formatDate(visit.visitDate)} />
              <Detail
                label="Expected Arrival"
                value={formatTime(visit.expectedArrivalTime)}
              />
              <Detail
                label="Check-In Time"
                value={formatDateTime(visit.checkInTime)}
              />
              <Detail
                label="Check-Out Time"
                value={formatDateTime(visit.checkOutTime)}
              />
            </dl>
          </section>

          <section className="mt-7 border-t border-slate-200 pt-6">
            <h2 className="visitor-pass-section-title">Authorization</h2>
            <dl className="mt-3 grid gap-3 sm:grid-cols-2">
              <Detail label="Approved By" value={visit.approvedBy?.name} />
              <Detail
                label="Approved Date & Time"
                value={formatDateTime(visit.approvedAt)}
              />
            </dl>
          </section>

          <section className="mt-7 flex flex-col items-center gap-5 border-t border-slate-200 pt-6 sm:flex-row sm:items-start">
            <div className="visitor-pass-qr-box shrink-0 rounded-lg border-2 border-slate-900 p-3">
              <QRCodeSVG
                value={verificationUrl}
                size={132}
                bgColor="#ffffff"
                fgColor="#0f172a"
                level="M"
              />
            </div>
            <div className="pt-1 text-center sm:text-left">
              <h2 className="visitor-pass-section-title">QR Verification</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Scan to verify this visitor pass with reception.
              </p>
              <p className="mt-2 break-all font-mono text-[10px] text-slate-400">
                {verificationUrl}
              </p>
            </div>
          </section>

          <footer className="mt-7 border-t-2 border-slate-900 pt-5 text-xs leading-5 text-slate-600">
            <p className="font-bold uppercase tracking-wide text-slate-900">
              Pass Policy
            </p>
            <ul className="mt-2 grid gap-1 sm:grid-cols-3">
              <li>Non-transferable; valid only for the named visitor.</li>
              <li>Wear this pass visibly while on the premises.</li>
              <li className="flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" />
                {receptionEmail} | {receptionPhone}
              </li>
            </ul>
          </footer>
        </div>
      </div>
    </div>
  );
}
