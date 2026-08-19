import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Clock3,
  Loader2,
  RefreshCcw,
  UserRound,
  UsersRound,
} from "lucide-react";
import { getUsers } from "../services/userService";
import { getActiveQueues, reallotVisitor } from "../services/visitorService";

const formatTime = (time) => {
  if (!time) return "-";
  const [hours, minutes] = time.split(":");
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
};

const formatEndTime = (dateTime) =>
  dateTime
    ? new Date(dateTime).toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
      })
    : "-";

export default function QueueDashboard({ canReassign = false }) {
  const [queues, setQueues] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actingId, setActingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchQueues = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    else setRefreshing(true);
    try {
      const data = await getActiveQueues();
      setQueues(Array.isArray(data) ? data : []);
      setError("");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to load the active employee queues.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchQueues(true);
    const intervalId = window.setInterval(() => fetchQueues(), 5000);
    return () => window.clearInterval(intervalId);
  }, [fetchQueues]);

  useEffect(() => {
    if (!canReassign) return undefined;

    let active = true;
    getUsers("Employee")
      .then((data) => {
        if (active) setEmployees(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (active) setError("Failed to load employees for re-assignment.");
      });

    return () => {
      active = false;
    };
  }, [canReassign]);

  const handleReallot = async (visitId, employeeId) => {
    if (!employeeId) return;
    setActingId(visitId);
    setError("");
    setSuccess("");
    try {
      await reallotVisitor(visitId, employeeId);
      setSuccess("Visitor host re-assigned successfully.");
      await fetchQueues();
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to re-assign visitor host.",
      );
    } finally {
      setActingId(null);
    }
  };

  return (
    <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <UsersRound className="h-4 w-4 text-indigo-600" />
            Live Employee Queues
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Ongoing meetings and waiting visitors, updated every five seconds.
          </p>
        </div>
        <button
          type="button"
          onClick={() => fetchQueues()}
          disabled={refreshing}
          className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCcw
            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      {error && (
        <div
          className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div
          className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
          role="status"
        >
          {success}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-7 w-7 animate-spin text-indigo-600" />
        </div>
      ) : queues.length === 0 ? (
        <div className="py-12 text-center text-sm text-slate-500">
          No employees are available to display.
        </div>
      ) : (
        <div className="space-y-4">
          {queues.map(({ employee, ongoingMeeting, queue }) => (
            <article
              key={employee._id}
              className="rounded-lg border border-slate-200"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
                <div>
                  <h4 className="font-semibold text-slate-900">
                    {employee.name}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {employee.department || "No department"}
                  </p>
                </div>
                <span className="text-xs font-medium text-slate-500">
                  {queue.length}/3 waiting
                </span>
              </div>

              <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                  <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                    <UserRound className="h-3.5 w-3.5" />
                    Ongoing meeting
                  </p>
                  {ongoingMeeting ? (
                    <div className="text-sm text-emerald-950">
                      <p className="font-semibold">
                        {ongoingMeeting.visitorId?.name || "Unknown visitor"}
                      </p>
                      <p className="mt-1 text-xs text-emerald-700">
                        {ongoingMeeting.purpose || "No purpose provided"}
                      </p>
                      <p className="mt-2 flex items-center gap-1 text-xs text-emerald-700">
                        <Clock3 className="h-3.5 w-3.5" />
                        Until {formatEndTime(ongoingMeeting.expectedEndTime)}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-emerald-800">
                      No ongoing meeting
                    </p>
                  )}
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Waiting queue
                  </p>
                  {queue.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-slate-300 px-4 py-6 text-sm text-slate-500">
                      No visitors waiting.
                    </p>
                  ) : (
                    <ol className="space-y-2">
                      {queue.map((visit) => (
                        <li
                          key={visit._id}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2.5"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                              {visit.queuePosition}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-slate-900">
                                {visit.visitorId?.name || "Unknown visitor"}
                              </p>
                              <p className="text-xs text-slate-500">
                                Arrival {formatTime(visit.expectedArrivalTime)}
                              </p>
                            </div>
                          </div>
                          {canReassign && (
                            <label className="flex items-center gap-2 text-xs text-slate-500">
                              <ArrowRight className="h-3.5 w-3.5" />
                              <span className="sr-only">Re-assign host</span>
                              <select
                                value=""
                                onChange={(event) =>
                                  handleReallot(visit._id, event.target.value)
                                }
                                disabled={actingId === visit._id}
                                className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-700"
                              >
                                <option value="">Re-assign host</option>
                                {employees
                                  .filter(
                                    (candidate) =>
                                      candidate._id !== employee._id,
                                  )
                                  .map((candidate) => (
                                    <option
                                      key={candidate._id}
                                      value={candidate._id}
                                    >
                                      {candidate.name} (
                                      {candidate.department || "No dept"})
                                    </option>
                                  ))}
                              </select>
                            </label>
                          )}
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
