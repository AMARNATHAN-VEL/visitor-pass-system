import QueueDashboard from "../../components/QueueDashboard";

export default function ReceptionistDashboard() {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-900">
          Reception Queue Dashboard
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Monitor active meetings and re-assign waiting visitors.
        </p>
      </div>
      <QueueDashboard canReassign />
    </div>
  );
}
