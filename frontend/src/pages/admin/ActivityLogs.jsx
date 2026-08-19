import { useEffect, useState, useCallback } from "react";
import {
  Activity,
  Loader2,
  AlertCircle,
  RefreshCcw,
  Search,
  Clock,
  User,
  FileText,
} from "lucide-react";
import api from "../../services/api";

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200";

const labelClass = "mb-1.5 block text-sm font-medium text-slate-700";

const ACTION_STYLES = {
  Created: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  Approved: "bg-green-50 text-green-700 ring-green-200",
  Rejected: "bg-red-50 text-red-700 ring-red-200",
  "Checked In": "bg-emerald-50 text-emerald-700 ring-emerald-200",
  "Checked Out": "bg-slate-100 text-slate-600 ring-slate-200",
  Cancelled: "bg-gray-50 text-gray-500 ring-gray-200",
};

export default function ActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/reports/activity-logs");
      setLogs(Array.isArray(response.data.data) ? response.data.data : []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to load activity logs. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filteredLogs = logs.filter((log) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;

    const action = (log.action || "").toLowerCase();
    const performedByName = (log.performedBy?.name || "").toLowerCase();
    const visitRequestId = (log.visitRequestId?._id || log.visitRequestId || "")
      .toString()
      .toLowerCase();

    return (
      action.includes(query) ||
      performedByName.includes(query) ||
      visitRequestId.includes(query)
    );
  });

  const formatTimestamp = (ts) => {
    if (!ts) return "—";
    const d = new Date(ts);
    return d.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Activity Logs
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Audit trail of all actions performed across the visitor pass system.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchLogs}
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

      {/* Search */}
      <section className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Search className="h-4 w-4 text-indigo-600" />
            Search Logs
          </h3>
          <p className="text-sm text-slate-500">
            Showing{" "}
            <span className="font-semibold text-slate-900">
              {filteredLogs.length}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-slate-900">{logs.length}</span>{" "}
            entries
          </p>
        </div>

        <div>
          <label htmlFor="search" className={labelClass}>
            Search by Action, User, or Request ID
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="e.g. Approved, John Doe, or request ID..."
              className={`${inputClass} pl-9`}
            />
          </div>
        </div>
      </section>

      {/* Logs table */}
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              <p className="text-sm text-slate-500">Loading activity logs...</p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && filteredLogs.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <Activity className="h-10 w-10 text-slate-300" />
            <p className="text-sm font-medium text-slate-600">
              No activity logs found
            </p>
            <p className="text-sm text-slate-400">
              {search
                ? "Try a different search term."
                : "No audit trail entries recorded yet."}
            </p>
          </div>
        )}

        {/* Table */}
        {!loading && filteredLogs.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Action
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Timestamp
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Performed By
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Visitor Request ID
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredLogs.map((log) => (
                  <tr key={log._id} className="transition hover:bg-slate-50">
                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                          ACTION_STYLES[log.action] ||
                          "bg-slate-100 text-slate-600 ring-slate-200"
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <p className="flex items-center gap-1.5 text-sm text-slate-700">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        {formatTimestamp(log.timestamp || log.createdAt)}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <p className="flex items-center gap-1.5 text-sm font-medium text-slate-900">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        {log.performedBy?.name || "Unknown User"}
                      </p>
                      <p className="mt-0.5 pl-5 text-xs text-slate-500">
                        {log.performedBy?.email || "—"}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <p className="flex items-center gap-1.5 font-mono text-xs text-slate-600">
                        <FileText className="h-3.5 w-3.5 text-slate-400" />
                        {log.visitRequestId?._id || log.visitRequestId || "—"}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
