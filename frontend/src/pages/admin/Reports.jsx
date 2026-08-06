import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  FileText,
  Search,
  Loader2,
  AlertCircle,
  RefreshCcw,
  CalendarDays,
  CalendarRange,
  Users,
  UserCheck,
  XCircle,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { getActiveVisits } from '../../services/visitorService';

const inputClass =
  'w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200';

const labelClass = 'mb-1.5 block text-sm font-medium text-slate-700';

const STATUS_STYLES = {
  Pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  Approved: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  Rejected: 'bg-red-50 text-red-700 ring-red-200',
  CheckedIn: 'bg-green-50 text-green-700 ring-green-200',
  CheckedOut: 'bg-slate-100 text-slate-600 ring-slate-200',
  Cancelled: 'bg-gray-50 text-gray-500 ring-gray-200',
};

const STATUS_OPTIONS = ['All', 'Pending', 'Approved', 'Rejected', 'CheckedIn', 'CheckedOut', 'Cancelled'];

const PERIOD_OPTIONS = [
  { value: 'today', label: 'Today', icon: CalendarDays },
  { value: 'week', label: 'This Week', icon: CalendarRange },
  { value: 'custom', label: 'Custom Range', icon: CalendarRange },
];

const EMPTY_FILTERS = {
  search: '',
  status: 'All',
  visitDate: '',
};

export default function Reports() {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [period, setPeriod] = useState('today');
  const [customRange, setCustomRange] = useState({ start: '', end: '' });

  const fetchVisits = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getActiveVisits();
      setVisits(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load reports. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVisits();
  }, [fetchVisits]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleCustomRangeChange = (e) => {
    const { name, value } = e.target;
    setCustomRange((prev) => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters(EMPTY_FILTERS);
    setCustomRange({ start: '', end: '' });
  };

  // --- Date range helpers ---
  const getPeriodRange = useCallback(() => {
    const now = new Date();
    const start = new Date(now);
    const end = new Date(now);

    if (period === 'today') {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (period === 'week') {
      const day = now.getDay(); // 0 = Sunday
      const diffToMonday = (day + 6) % 7;
      start.setDate(now.getDate() - diffToMonday);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else {
      // custom
      if (!customRange.start || !customRange.end) return null;
      start.setTime(new Date(customRange.start).getTime());
      start.setHours(0, 0, 0, 0);
      end.setTime(new Date(customRange.end).getTime());
      end.setHours(23, 59, 59, 999);
    }

    return { start, end };
  }, [period, customRange]);

  // --- Filtered visits (table) ---
  const filteredVisits = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    return visits.filter((visit) => {
      // Search by visitor name or employee name
      if (search) {
        const visitorName = (visit.visitorId?.name || '').toLowerCase();
        const employeeName = (visit.employeeId?.name || '').toLowerCase();
        if (!visitorName.includes(search) && !employeeName.includes(search)) {
          return false;
        }
      }

      // Status filter
      if (filters.status !== 'All' && visit.status !== filters.status) {
        return false;
      }

      // Visit date filter
      if (filters.visitDate) {
        const visitDate = new Date(visit.visitDate);
        const filterDate = new Date(filters.visitDate);
        if (
          visitDate.getFullYear() !== filterDate.getFullYear() ||
          visitDate.getMonth() !== filterDate.getMonth() ||
          visitDate.getDate() !== filterDate.getDate()
        ) {
          return false;
        }
      }

      return true;
    });
  }, [visits, filters]);

  // --- Summary analytics (period-based) ---
  const summary = useMemo(() => {
    const range = getPeriodRange();
    if (!range) {
      return { total: 0, checkedIn: 0, checkedOut: 0, pending: 0, approved: 0, rejected: 0, cancelled: 0 };
    }

    const inRange = visits.filter((visit) => {
      const visitDate = new Date(visit.visitDate);
      return visitDate >= range.start && visitDate <= range.end;
    });

    return {
      total: inRange.length,
      checkedIn: inRange.filter((v) => v.status === 'CheckedIn').length,
      checkedOut: inRange.filter((v) => v.status === 'CheckedOut').length,
      pending: inRange.filter((v) => v.status === 'Pending').length,
      approved: inRange.filter((v) => v.status === 'Approved').length,
      rejected: inRange.filter((v) => v.status === 'Rejected').length,
      cancelled: inRange.filter((v) => v.status === 'Cancelled').length,
    };
  }, [visits, period, customRange, getPeriodRange]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '—';
    const [h, m] = timeStr.split(':');
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${displayHour}:${m} ${ampm}`;
  };

  const summaryCards = [
    { key: 'total', label: 'Total Visits', icon: FileText, iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600' },
    { key: 'checkedIn', label: 'Checked In', icon: UserCheck, iconBg: 'bg-green-100', iconColor: 'text-green-600' },
    { key: 'checkedOut', label: 'Checked Out', icon: Clock, iconBg: 'bg-slate-100', iconColor: 'text-slate-600' },
    { key: 'pending', label: 'Pending', icon: Clock, iconBg: 'bg-amber-100', iconColor: 'text-amber-600' },
    { key: 'approved', label: 'Approved', icon: CheckCircle2, iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600' },
    { key: 'rejected', label: 'Rejected', icon: XCircle, iconBg: 'bg-red-100', iconColor: 'text-red-600' },
    { key: 'cancelled', label: 'Cancelled', icon: XCircle, iconBg: 'bg-gray-100', iconColor: 'text-gray-500' },
  ];

  return (
    <div className="mx-auto max-w-7xl">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Reports</h2>
          <p className="mt-1 text-sm text-slate-500">
            Search, filter, and analyze visitor activity across the organization.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchVisits}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3" role="alert">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Summary analytics section */}
      <section className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <FileText className="h-4 w-4 text-indigo-600" />
            Summary Analytics
          </h3>

          {/* Period selector */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex overflow-hidden rounded-lg border border-slate-300">
              {PERIOD_OPTIONS.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPeriod(value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition ${
                    period === value
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>

            {/* Custom date range */}
            {period === 'custom' && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  name="start"
                  value={customRange.start}
                  onChange={handleCustomRangeChange}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
                <span className="text-sm text-slate-400">to</span>
                <input
                  type="date"
                  name="end"
                  value={customRange.end}
                  onChange={handleCustomRangeChange}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
              </div>
            )}
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {summaryCards.map(({ key, label, icon: Icon, iconBg, iconColor }) => (
            <div key={key} className="rounded-lg border border-slate-100 bg-slate-50/50 p-4">
              <div className="flex items-center gap-2">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${iconBg}`}>
                  <Icon className={`h-4 w-4 ${iconColor}`} />
                </div>
                <p className="text-xs font-medium text-slate-500">{label}</p>
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                {summary[key] ?? 0}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Filters */}
      <section className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Search className="h-4 w-4 text-indigo-600" />
            Filters
          </h3>
          <button
            type="button"
            onClick={clearFilters}
            className="text-xs font-medium text-indigo-600 transition hover:text-indigo-800"
          >
            Clear all
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Search input */}
          <div>
            <label htmlFor="search" className={labelClass}>
              Visitor / Employee Name
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="search"
                name="search"
                type="text"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Search by name..."
                className={`${inputClass} pl-9`}
              />
            </div>
          </div>

          {/* Status dropdown */}
          <div>
            <label htmlFor="status" className={labelClass}>
              Status
            </label>
            <select
              id="status"
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className={inputClass}
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          {/* Visit date */}
          <div>
            <label htmlFor="visitDate" className={labelClass}>
              Visit Date
            </label>
            <input
              id="visitDate"
              name="visitDate"
              type="date"
              value={filters.visitDate}
              onChange={handleFilterChange}
              className={inputClass}
            />
          </div>

          {/* Result count */}
          <div className="flex items-end">
            <p className="text-sm text-slate-500">
              Showing <span className="font-semibold text-slate-900">{filteredVisits.length}</span> of{' '}
              <span className="font-semibold text-slate-900">{visits.length}</span> visits
            </p>
          </div>
        </div>
      </section>

      {/* Results table */}
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              <p className="text-sm text-slate-500">Loading reports...</p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && filteredVisits.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <Users className="h-10 w-10 text-slate-300" />
            <p className="text-sm font-medium text-slate-600">No visits found</p>
            <p className="text-sm text-slate-400">
              Try adjusting your search or filter criteria.
            </p>
          </div>
        )}

        {/* Table */}
        {!loading && filteredVisits.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Visitor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Employee
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Visit Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Arrival
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Purpose
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredVisits.map((visit) => (
                  <tr key={visit._id} className="transition hover:bg-slate-50">
                    <td className="whitespace-nowrap px-4 py-3">
                      <p className="text-sm font-medium text-slate-900">
                        {visit.visitorId?.name || 'Unknown'}
                      </p>
                      <p className="text-xs text-slate-500">{visit.visitorId?.phone || '—'}</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <p className="text-sm text-slate-700">{visit.employeeId?.name || 'Unknown'}</p>
                      <p className="text-xs text-slate-500">{visit.employeeId?.department || '—'}</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700">
                      {formatDate(visit.visitDate)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700">
                      {formatTime(visit.expectedArrivalTime)}
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-sm text-slate-700">
                      {visit.purpose || '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                          STATUS_STYLES[visit.status] || 'bg-slate-100 text-slate-600 ring-slate-200'
                        }`}
                      >
                        {visit.status}
                      </span>
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