import { useEffect, useState, useMemo, useCallback } from "react";
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
  Download,
  CheckSquare,
  LogOut,
  FileDown,
  FileSpreadsheet,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import {
  getActiveVisits,
  bulkVisitorAction,
} from "../../services/visitorService";
import { useAuth } from "../../context/AuthContext";

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200";

const labelClass = "mb-1.5 block text-sm font-medium text-slate-700";

const STATUS_STYLES = {
  Pending: "bg-amber-50 text-amber-700 ring-amber-200",
  Approved: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  Rejected: "bg-red-50 text-red-700 ring-red-200",
  CheckedIn: "bg-green-50 text-green-700 ring-green-200",
  CheckedOut: "bg-slate-100 text-slate-600 ring-slate-200",
  Cancelled: "bg-gray-50 text-gray-500 ring-gray-200",
};

const STATUS_OPTIONS = [
  { value: "All", label: "All Statuses" },
  { value: "Pending", label: "Pending" },
  { value: "Approved", label: "Approved" },
  { value: "CheckedIn", label: "Checked-In" },
  { value: "CheckedOut", label: "Checked-Out" },
  { value: "Rejected", label: "Rejected" },
];

const PERIOD_OPTIONS = [
  { value: "today", label: "Today", icon: CalendarDays },
  { value: "week", label: "This Week", icon: CalendarRange },
  { value: "custom", label: "Custom Range", icon: CalendarRange },
];

const EMPTY_FILTERS = {
  search: "",
  status: "All",
  startDate: "",
  endDate: "",
  department: "All",
};

export default function Reports() {
  const { user } = useAuth();
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [period, setPeriod] = useState("today");
  const [customRange, setCustomRange] = useState({ start: "", end: "" });
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  const fetchVisits = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getActiveVisits(filters);
      setVisits(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to load reports. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, [filters]);

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
    setFilters({ ...EMPTY_FILTERS });
    setCustomRange({ start: "", end: "" });
  };

  const departments = useMemo(
    () =>
      [
        ...new Set(
          visits.map((visit) => visit.employeeId?.department).filter(Boolean),
        ),
      ].sort(),
    [visits],
  );

  const toggleVisit = (id) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllVisible = () => {
    setSelectedIds((current) => {
      const next = new Set(current);
      const allSelected =
        filteredVisits.length > 0 &&
        filteredVisits.every((visit) => next.has(visit._id));
      filteredVisits.forEach((visit) => {
        if (allSelected) next.delete(visit._id);
        else next.add(visit._id);
      });
      return next;
    });
  };

  const exportSelected = () => {
    const selectedVisits = visits.filter((visit) => selectedIds.has(visit._id));
    const escapeCsv = (value) =>
      `"${String(value ?? "").replaceAll('"', '""')}"`;
    const rows = [
      [
        "Visitor",
        "Employee",
        "Department",
        "Visit Date",
        "Expected Arrival",
        "Purpose",
        "Status",
      ],
      ...selectedVisits.map((visit) => [
        visit.visitorId?.name,
        visit.employeeId?.name,
        visit.employeeId?.department,
        formatDate(visit.visitDate),
        formatTime(visit.expectedArrivalTime),
        visit.purpose,
        visit.status,
      ]),
    ];
    const blob = new Blob(
      [rows.map((row) => row.map(escapeCsv).join(",")).join("\n")],
      { type: "text/csv;charset=utf-8;" },
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `visitor-report-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getExportRows = () =>
    filteredVisits.map((visit) => ({
      Visitor: visit.visitorId?.name || "Unknown",
      Employee: visit.employeeId?.name || "Unknown",
      Department: visit.employeeId?.department || "—",
      "Visit Date": formatDate(visit.visitDate),
      "Expected Arrival": formatTime(visit.expectedArrivalTime),
      Purpose: visit.purpose || "—",
      Status: visit.status,
    }));

  const exportToPdf = () => {
    const rows = getExportRows();
    const document = new jsPDF({ orientation: "landscape" });
    const timestamp = new Date().toLocaleString();
    document.setFontSize(18);
    document.text("Visitor Activity Report", 14, 18);
    document.setFontSize(9);
    document.setTextColor(100, 116, 139);
    document.text(`Generated ${timestamp} | ${rows.length} records`, 14, 25);
    document.setTextColor(15, 23, 42);

    autoTable(document, {
      startY: 32,
      head: [
        Object.keys(
          rows[0] || {
            Visitor: "",
            Employee: "",
            Department: "",
            "Visit Date": "",
            "Expected Arrival": "",
            Purpose: "",
            Status: "",
          },
        ),
      ],
      body: rows.map((row) => Object.values(row)),
      theme: "grid",
      headStyles: {
        fillColor: [79, 70, 229],
        textColor: 255,
        fontStyle: "bold",
      },
      styles: { fontSize: 8, cellPadding: 3 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });

    document.save(
      `visitor-report-${new Date().toISOString().slice(0, 10)}.pdf`,
    );
    setSuccess(
      `PDF exported with ${rows.length} record${rows.length === 1 ? "" : "s"}.`,
    );
  };

  const exportToExcel = () => {
    const rows = getExportRows();
    const headers = [
      "Visitor",
      "Employee",
      "Department",
      "Visit Date",
      "Expected Arrival",
      "Purpose",
      "Status",
    ];
    const worksheet = XLSX.utils.aoa_to_sheet([
      headers,
      ...rows.map((row) => headers.map((header) => row[header])),
    ]);
    worksheet["!cols"] = [
      { wch: 22 },
      { wch: 22 },
      { wch: 18 },
      { wch: 16 },
      { wch: 18 },
      { wch: 30 },
      { wch: 14 },
    ];
    worksheet["!autofilter"] = { ref: `A1:G${Math.max(rows.length + 1, 2)}` };
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Visitor Reports");
    XLSX.writeFile(
      workbook,
      `visitor-report-${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
    setSuccess(
      `Excel exported with ${rows.length} record${rows.length === 1 ? "" : "s"}.`,
    );
  };

  const handleBulkAction = async (action) => {
    if (action === "approve" && user?.role !== "Employee") {
      setError("Only Employees can bulk approve visit requests.");
      return;
    }
    if (action === "checkOut" && user?.role !== "Receptionist") {
      setError("Only Receptionists can bulk check out visitors.");
      return;
    }

    setBulkLoading(true);
    setError("");
    setSuccess("");
    try {
      const result = await bulkVisitorAction([...selectedIds], action);
      setSuccess(
        `${result.modifiedCount} visit${result.modifiedCount === 1 ? "" : "s"} updated successfully.`,
      );
      setSelectedIds(new Set());
      await fetchVisits();
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Bulk action failed. Please try again.",
      );
    } finally {
      setBulkLoading(false);
    }
  };

  // --- Date range helpers ---
  const getPeriodRange = useCallback(() => {
    const now = new Date();
    const start = new Date(now);
    const end = new Date(now);

    if (period === "today") {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (period === "week") {
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
        const visitorName = (visit.visitorId?.name || "").toLowerCase();
        const employeeName = (visit.employeeId?.name || "").toLowerCase();
        if (!visitorName.includes(search) && !employeeName.includes(search)) {
          return false;
        }
      }

      // Status filter
      if (filters.status !== "All" && visit.status !== filters.status) {
        return false;
      }

      // Visit date filter
      const visitDate = new Date(visit.visitDate);
      if (filters.startDate) {
        const startDate = new Date(`${filters.startDate}T00:00:00`);
        if (visitDate < startDate) return false;
      }
      if (filters.endDate) {
        const endDate = new Date(`${filters.endDate}T23:59:59.999`);
        if (visitDate > endDate) return false;
      }

      if (
        filters.department !== "All" &&
        visit.employeeId?.department !== filters.department
      ) {
        return false;
      }

      return true;
    });
  }, [visits, filters]);

  const allVisibleSelected =
    filteredVisits.length > 0 &&
    filteredVisits.every((visit) => selectedIds.has(visit._id));

  // --- Summary analytics (period-based) ---
  const summary = useMemo(() => {
    const range = getPeriodRange();
    if (!range) {
      return {
        total: 0,
        checkedIn: 0,
        checkedOut: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        cancelled: 0,
      };
    }

    const inRange = visits.filter((visit) => {
      const visitDate = new Date(visit.visitDate);
      return visitDate >= range.start && visitDate <= range.end;
    });

    return {
      total: inRange.length,
      checkedIn: inRange.filter((v) => v.status === "CheckedIn").length,
      checkedOut: inRange.filter((v) => v.status === "CheckedOut").length,
      pending: inRange.filter((v) => v.status === "Pending").length,
      approved: inRange.filter((v) => v.status === "Approved").length,
      rejected: inRange.filter((v) => v.status === "Rejected").length,
      cancelled: inRange.filter((v) => v.status === "Cancelled").length,
    };
  }, [visits, period, customRange, getPeriodRange]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return "—";
    const [h, m] = timeStr.split(":");
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${displayHour}:${m} ${ampm}`;
  };

  const summaryCards = [
    {
      key: "total",
      label: "Total Visits",
      icon: FileText,
      iconBg: "bg-indigo-100",
      iconColor: "text-indigo-600",
    },
    {
      key: "checkedIn",
      label: "Checked In",
      icon: UserCheck,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      key: "checkedOut",
      label: "Checked Out",
      icon: Clock,
      iconBg: "bg-slate-100",
      iconColor: "text-slate-600",
    },
    {
      key: "pending",
      label: "Pending",
      icon: Clock,
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
    },
    {
      key: "approved",
      label: "Approved",
      icon: CheckCircle2,
      iconBg: "bg-indigo-100",
      iconColor: "text-indigo-600",
    },
    {
      key: "rejected",
      label: "Rejected",
      icon: XCircle,
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
    },
    {
      key: "cancelled",
      label: "Cancelled",
      icon: XCircle,
      iconBg: "bg-gray-100",
      iconColor: "text-gray-500",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Reports</h2>
          <p className="mt-1 text-sm text-slate-500">
            Search, filter, and analyze visitor activity across the
            organization.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchVisits}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={exportToPdf}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-rose-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FileDown className="h-4 w-4" />
            Export to PDF
          </button>
          <button
            type="button"
            onClick={exportToExcel}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export to Excel
          </button>
        </div>
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

      {success && (
        <div
          className="mb-5 flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3"
          role="status"
        >
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
          <p className="text-sm text-green-700">{success}</p>
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
                      ? "bg-indigo-600 text-white"
                      : "bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>

            {/* Custom date range */}
            {period === "custom" && (
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
            <div
              key={key}
              className="rounded-lg border border-slate-100 bg-slate-50/50 p-4"
            >
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${iconBg}`}
                >
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

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
              {STATUS_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Start date */}
          <div>
            <label htmlFor="startDate" className={labelClass}>
              Start Date
            </label>
            <input
              id="startDate"
              name="startDate"
              type="date"
              value={filters.startDate}
              onChange={handleFilterChange}
              className={inputClass}
            />
          </div>

          {/* End date */}
          <div>
            <label htmlFor="endDate" className={labelClass}>
              End Date
            </label>
            <input
              id="endDate"
              name="endDate"
              type="date"
              value={filters.endDate}
              onChange={handleFilterChange}
              className={inputClass}
            />
          </div>

          {/* Department dropdown */}
          <div>
            <label htmlFor="department" className={labelClass}>
              Department
            </label>
            <select
              id="department"
              name="department"
              value={filters.department}
              onChange={handleFilterChange}
              className={inputClass}
            >
              <option value="All">All Departments</option>
              {departments.map((department) => (
                <option key={department} value={department}>
                  {department}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className="mt-4 text-sm text-slate-500">
          Showing{" "}
          <span className="font-semibold text-slate-900">
            {filteredVisits.length}
          </span>{" "}
          of{" "}
          <span className="font-semibold text-slate-900">{visits.length}</span>{" "}
          visits
        </p>
      </section>

      {selectedIds.size > 0 && (
        <section className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-medium text-indigo-900">
            <CheckSquare className="h-4 w-4" />
            {selectedIds.size} visitor{selectedIds.size === 1 ? "" : "s"}{" "}
            selected
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleBulkAction("approve")}
              disabled={bulkLoading || user?.role !== "Employee"}
              title={
                user?.role === "Employee"
                  ? "Approve selected pending requests"
                  : "Employee access required"
              }
              className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Bulk Approve
            </button>
            <button
              type="button"
              onClick={() => handleBulkAction("checkOut")}
              disabled={bulkLoading || user?.role !== "Receptionist"}
              title={
                user?.role === "Receptionist"
                  ? "Check out selected checked-in visitors"
                  : "Receptionist access required"
              }
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <LogOut className="h-3.5 w-3.5" />
              Bulk Check-Out
            </button>
            <button
              type="button"
              onClick={exportSelected}
              disabled={bulkLoading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-300 bg-white px-3 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" />
              Export Selected
            </button>
          </div>
        </section>
      )}

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
            <p className="text-sm font-medium text-slate-600">
              No visits found
            </p>
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
                  <th className="w-12 px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      aria-label="Select all visible visitors"
                      checked={allVisibleSelected}
                      onChange={toggleAllVisible}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </th>
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
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        aria-label={`Select ${visit.visitorId?.name || "visitor"}`}
                        checked={selectedIds.has(visit._id)}
                        onChange={() => toggleVisit(visit._id)}
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <p className="text-sm font-medium text-slate-900">
                        {visit.visitorId?.name || "Unknown"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {visit.visitorId?.phone || "—"}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <p className="text-sm text-slate-700">
                        {visit.employeeId?.name || "Unknown"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {visit.employeeId?.department || "—"}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700">
                      {formatDate(visit.visitDate)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700">
                      {formatTime(visit.expectedArrivalTime)}
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-sm text-slate-700">
                      {visit.purpose || "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                          STATUS_STYLES[visit.status] ||
                          "bg-slate-100 text-slate-600 ring-slate-200"
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
