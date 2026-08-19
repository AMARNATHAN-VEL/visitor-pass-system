import { useEffect, useState } from "react";
import {
  Inbox,
  CalendarDays,
  UserCheck,
  Users,
  Loader2,
  AlertCircle,
  RefreshCcw,
} from "lucide-react";
import { getDashboardMetrics } from "../../services/reportService";
import VisitorAnalytics from "../../components/VisitorAnalytics";
import QueueDashboard from "../../components/QueueDashboard";

const METRICS = [
  {
    key: "pendingRequests",
    label: "Pending Requests",
    description: "Awaiting employee approval",
    icon: Inbox,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
  },
  {
    key: "todayVisitors",
    label: "Today's Visitors",
    description: "Scheduled for today",
    icon: CalendarDays,
    iconBg: "bg-indigo-100",
    iconColor: "text-indigo-600",
  },
  {
    key: "visitorsInside",
    label: "Visitors Currently Inside",
    description: "Checked in and on premises",
    icon: UserCheck,
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
  },
  {
    key: "totalEmployees",
    label: "Total Employees",
    description: "Registered employee accounts",
    icon: Users,
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
  },
];

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchMetrics = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getDashboardMetrics();
      setMetrics(data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to load dashboard metrics. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Dashboard Overview
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Real-time summary of visitor activity and employees.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchMetrics}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div
          className="mb-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3"
          role="alert"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-white py-16">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            <p className="text-sm text-slate-500">
              Loading dashboard metrics...
            </p>
          </div>
        </div>
      )}

      {/* Metrics grid */}
      {!loading && metrics && (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {METRICS.map(
            ({ key, label, description, icon: Icon, iconBg, iconColor }) => (
              <div
                key={key}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      {label}
                    </p>
                    <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                      {metrics[key] ?? 0}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">{description}</p>
                  </div>
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${iconBg}`}
                  >
                    <Icon className={`h-6 w-6 ${iconColor}`} />
                  </div>
                </div>
              </div>
            ),
          )}
        </div>
      )}

      {!loading && metrics && <VisitorAnalytics />}
      {!loading && metrics && <QueueDashboard />}
    </div>
  );
}
