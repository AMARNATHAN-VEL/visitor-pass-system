import { useEffect, useState, useCallback } from 'react';
import { Inbox, CheckCircle2, XCircle, Loader2, AlertCircle, Mail, Phone, Hash, CalendarDays, Clock, Tag, FileText } from 'lucide-react';
import { getPendingVisits, updateVisitStatus } from '../../services/visitorService';

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatTime = (timeStr) => {
  if (!timeStr) return '-';
  const [hours, minutes] = timeStr.split(':');
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
};

export default function PendingRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Approve/reject pending states
  const [approvingId, setApprovingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectRemarks, setRejectRemarks] = useState('');

  const fetchPending = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getPendingVisits();
      setRequests(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load pending requests. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  const handleApprove = async (id) => {
    setApprovingId(id);
    setError('');
    setSuccess('');
    try {
      await updateVisitStatus(id, 'Approved', '');
      setSuccess('Request approved.');
      setRequests((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve request. Please try again.');
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectingId) return;

    if (!rejectRemarks.trim()) {
      setError('Remarks are required when rejecting a request.');
      return;
    }

    setError('');
    setSuccess('');
    try {
      await updateVisitStatus(rejectingId, 'Rejected', rejectRemarks.trim());
      setSuccess('Request rejected.');
      setRequests((prev) => prev.filter((r) => r._id !== rejectingId));
      setRejectingId(null);
      setRejectRemarks('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject request. Please try again.');
    }
  };

  const openRejectModal = (id) => {
    setError('');
    setRejectRemarks('');
    setRejectingId(id);
  };

  const closeRejectModal = () => {
    setRejectingId(null);
    setRejectRemarks('');
  };

  const rejectingRequest = requests.find((r) => r._id === rejectingId) || null;

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-900">Pending Requests</h2>
        <p className="mt-1 text-sm text-slate-500">
          Visitor requests awaiting your approval or rejection.
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3" role="alert">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Success banner */}
      {success && (
        <div className="mb-5 flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3" role="status">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-white py-16">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            <p className="text-sm text-slate-500">Loading pending requests...</p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && requests.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <Inbox className="h-10 w-10 text-slate-300" />
          <p className="text-sm font-medium text-slate-600">No pending requests</p>
          <p className="text-sm text-slate-400">New visitor requests assigned to you will appear here.</p>
        </div>
      )}

      {/* Request cards */}
      {!loading && requests.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2">
          {requests.map((request) => {
            const isApproving = approvingId === request._id;
            const isRejecting = rejectingId === request._id;

            return (
              <article
                key={request._id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                {/* Visitor identity */}
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-semibold text-slate-900">
                      {request.visitorId?.name || 'Unknown visitor'}
                    </h3>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                      <Mail className="h-3.5 w-3.5" />
                      <span className="truncate">{request.visitorId?.email || 'No email'}</span>
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                      <Phone className="h-3.5 w-3.5" />
                      {request.visitorId?.phone || 'No phone'}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                      <Hash className="h-3.5 w-3.5" />
                      {request.visitorId?.govtId || 'No govt ID'}
                    </p>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">
                    <Clock className="h-3 w-3" />
                    Pending
                  </span>
                </div>

                {/* Visit details */}
                <dl className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-4 text-sm">
                  <div>
                    <dt className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                      <CalendarDays className="h-3.5 w-3.5" />
                      Visit Date
                    </dt>
                    <dd className="mt-0.5 text-slate-700">{formatDate(request.visitDate)}</dd>
                  </div>
                  <div>
                    <dt className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                      <Clock className="h-3.5 w-3.5" />
                      Arrival
                    </dt>
                    <dd className="mt-0.5 text-slate-700">{formatTime(request.expectedArrivalTime)}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                      <Tag className="h-3.5 w-3.5" />
                      Purpose
                    </dt>
                    <dd className="mt-0.5 text-slate-700">{request.purpose}</dd>
                  </div>
                </dl>

                {/* Actions */}
                <div className="mt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => handleApprove(request._id)}
                    disabled={isApproving || isRejecting}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-300 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isApproving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => openRejectModal(request._id)}
                    disabled={isApproving || isRejecting}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-200 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isRejecting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    Reject
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Reject modal */}
      {rejectingRequest && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reject-modal-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-100">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 id="reject-modal-title" className="text-base font-semibold text-slate-900">
                  Reject visit request
                </h3>
                <p className="mt-0.5 text-sm text-slate-500">
                  Visitor: <span className="font-medium text-slate-700">{rejectingRequest.visitorId?.name || 'Unknown'}</span>
                </p>
                <p className="text-sm text-slate-500">
                  Date: <span className="font-medium text-slate-700">{formatDate(rejectingRequest.visitDate)}</span> at{' '}
                  <span className="font-medium text-slate-700">{formatTime(rejectingRequest.expectedArrivalTime)}</span>
                </p>
              </div>
            </div>

            <label htmlFor="reject-remarks" className="mb-1.5 block text-sm font-medium text-slate-700">
              Remarks <span className="text-red-500">*</span>
            </label>
            <textarea
              id="reject-remarks"
              rows="4"
              value={rejectRemarks}
              onChange={(e) => {
                setRejectRemarks(e.target.value);
                setError('');
              }}
              placeholder="Explain why this visit request is being rejected..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-200"
              required
            />
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-400">
              <FileText className="h-3.5 w-3.5" />
              Remarks are mandatory and will be recorded.
            </p>

            {error && (
              <div className="mt-3 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2" role="alert">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeRejectModal}
                disabled={Boolean(rejectingId && requests.find((r) => r._id === rejectingId)?.status === 'Pending')}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={!rejectRemarks.trim()}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <XCircle className="h-4 w-4" />
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}