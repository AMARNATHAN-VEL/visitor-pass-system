import { useEffect, useState, useCallback } from "react";
import {
  LogIn,
  LogOut,
  RefreshCcw,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Users,
} from "lucide-react";
import {
  getActiveVisits,
  checkInVisitor,
  checkOutVisitor,
} from "../../services/visitorService";
import VisitorAnalytics from "../../components/VisitorAnalytics";

const STATUS_STYLES = {
  Pending: "bg-amber-50 text-amber-700 ring-amber-200",
  Approved: "bg-blue-50 text-blue-700 ring-blue-200",
  CheckedIn: "bg-green-50 text-green-700 ring-green-200",
  CheckedOut: "bg-slate-100 text-slate-600 ring-slate-200",
  Rejected: "bg-red-50 text-red-600 ring-red-200",
};

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatTime = (timeStr) => {
  if (!timeStr) return "-";
  const [hours, minutes] = timeStr.split(":");
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
};

const formatDateTime = (dateTime) => {
  if (!dateTime) return "-";
  return new Date(dateTime).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

export default function CheckInOut() {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchVisits = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getActiveVisits();
      setVisits(data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to load visits. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVisits();
  }, [fetchVisits]);

  const handleCheckIn = async (id) => {
    setActingId(id);
    setError("");
    setSuccess("");
    try {
      await checkInVisitor(id);
      setSuccess("Visitor checked in successfully.");
      await fetchVisits();
    } catch (err) {
      setError(
        err.response?.data?.message || "Check-in failed. Please try again.",
      );
    } finally {
      setActingId(null);
    }
  };

  const handleCheckOut = async (id) => {
    setActingId(id);
    setError("");
    setSuccess("");
    try {
      await checkOutVisitor(id);
      setSuccess("Visitor checked out successfully.");
      await fetchVisits();
    } catch (err) {
      setError(
        err.response?.data?.message || "Check-out failed. Please try again.",
      );
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Check-In / Check-Out
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Active visits awaiting check-in or currently in the building.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchVisits}
          className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
        >
          <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Error banner (server business-rule errors) */}
      {error && (
        <div
          className="mb-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3"
          role="alert"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Success banner */}
      {success && (
        <div
          className="mb-5 flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3"
          role="status"
        >
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-white py-16">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            <p className="text-sm text-slate-500">Loading active visits...</p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && visits.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <Users className="h-10 w-10 text-slate-300" />
          <p className="text-sm font-medium text-slate-600">No active visits</p>
          <p className="text-sm text-slate-400">
            Approved visitors will appear here for check-in.
          </p>
        </div>
      )}

      {/* Table */}
      {!loading && visits.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th
                    scope="col"
                    className="px-4 py-3 font-semibold text-slate-600"
                  >
                    Visitor
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 font-semibold text-slate-600"
                  >
                    Employee
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 font-semibold text-slate-600"
                  >
                    Purpose
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 font-semibold text-slate-600"
                  >
                    Visit Date
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 font-semibold text-slate-600"
                  >
                    Expected Arrival
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 font-semibold text-slate-600"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-right font-semibold text-slate-600"
                  >
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visits.map((visit) => {
                  const isCheckedIn = visit.status === "CheckedIn";
                  const isApproved = visit.status === "Approved";
                  const isPending = visit.status === "Pending";
                  const isCheckedOut = visit.status === "CheckedOut";
                  const canCheckIn = isApproved;
                  const canCheckOut = isCheckedIn;
                  const isActing = actingId === visit._id;

                  return (
                    <tr key={visit._id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">
                          {visit.visitorId?.name || "Unknown"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {visit.visitorId?.phone || ""}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-slate-700">
                          {visit.employeeId?.name || "Unknown"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {visit.employeeId?.department || ""}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {visit.purpose}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {formatDate(visit.visitDate)}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {formatTime(visit.expectedArrivalTime)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                            STATUS_STYLES[visit.status] ||
                            "bg-slate-100 text-slate-600 ring-slate-200"
                          }`}
                        >
                          {visit.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {canCheckIn && (
                          <button
                            type="button"
                            onClick={() => handleCheckIn(visit._id)}
                            disabled={isActing}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isActing ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <LogIn className="h-3.5 w-3.5" />
                            )}
                            Check In
                          </button>
                        )}
                        {canCheckOut && (
                          <button
                            type="button"
                            onClick={() => handleCheckOut(visit._id)}
                            disabled={isActing}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-300 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isActing ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <LogOut className="h-3.5 w-3.5" />
                            )}
                            Check Out
                          </button>
                        )}
                        {isPending && (
                          <span className="text-xs text-slate-400">
                            Awaiting approval
                          </span>
                        )}
                        {isCheckedOut && (
                          <span className="text-xs text-slate-400">
                            Out at {formatDateTime(visit.checkOutTime)}
                          </span>
                        )}
                        {!canCheckIn &&
                          !canCheckOut &&
                          !isPending &&
                          !isCheckedOut && (
                            <span className="text-xs text-slate-400">
                              No action
                            </span>
                          )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && <VisitorAnalytics />}
    </div>
  );
}
