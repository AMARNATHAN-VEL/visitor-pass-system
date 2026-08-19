import { useEffect, useState } from "react";
import {
  UserPlus,
  Clock,
  CalendarDays,
  Users,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { registerVisitor } from "../../services/visitorService";
import { getUsers } from "../../services/userService";

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200";

const labelClass = "mb-1.5 block text-sm font-medium text-slate-700";

export default function RegisterVisitor() {
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    govtId: "",
    employeeId: "",
    purpose: "",
    visitDate: "",
    expectedArrivalTime: "",
  });
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const users = await getUsers("Employee");
        setEmployees(users);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Failed to load employees. Please try again.",
        );
      } finally {
        setLoadingEmployees(false);
      }
    };
    fetchEmployees();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const {
      name,
      phone,
      govtId,
      employeeId,
      purpose,
      visitDate,
      expectedArrivalTime,
    } = form;

    if (
      !name ||
      !phone ||
      !govtId ||
      !employeeId ||
      !purpose ||
      !visitDate ||
      !expectedArrivalTime
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      const { visitor } = await registerVisitor(form);
      setSuccess(
        `Visitor ${visitor.name} registered successfully. Visit request created.`,
      );
      setForm({
        name: "",
        phone: "",
        email: "",
        govtId: "",
        employeeId: "",
        purpose: "",
        visitDate: "",
        expectedArrivalTime: "",
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to register visitor. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Compute the latest permitted date (visit date cannot be in the past)
  const now = new Date();
  const today = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-900">
          Register Visitor
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Create a visit request for an employee. The employee must approve it
          before check-in.
        </p>
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

      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        noValidate
      >
        {/* Visitor details */}
        <fieldset className="mb-6">
          <legend className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900">
            <UserPlus className="h-4 w-4 text-indigo-600" />
            Visitor Details
          </legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className={labelClass}>
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                placeholder="Jane Doe"
                className={inputClass}
                required
              />
            </div>
            <div>
              <label htmlFor="phone" className={labelClass}>
                Phone <span className="text-red-500">*</span>
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                placeholder="+1 555 123 4567"
                className={inputClass}
                required
              />
            </div>
            <div>
              <label htmlFor="email" className={labelClass}>
                Email <span className="text-slate-400">(optional)</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="jane@example.com"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="govtId" className={labelClass}>
                Government ID <span className="text-red-500">*</span>
              </label>
              <input
                id="govtId"
                name="govtId"
                type="text"
                value={form.govtId}
                onChange={handleChange}
                placeholder="Passport / Driver license / Aadhaar"
                className={inputClass}
                required
              />
            </div>
          </div>
        </fieldset>

        {/* Visit details */}
        <fieldset className="mb-6">
          <legend className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900">
            <CalendarDays className="h-4 w-4 text-indigo-600" />
            Visit Details
          </legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="employeeId" className={labelClass}>
                Visiting Employee <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Users className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <select
                  id="employeeId"
                  name="employeeId"
                  value={form.employeeId}
                  onChange={handleChange}
                  className={`${inputClass} appearance-none pl-9 ${form.employeeId ? "" : "text-slate-400"}`}
                  disabled={loadingEmployees}
                  required
                >
                  <option value="" disabled>
                    {loadingEmployees
                      ? "Loading employees..."
                      : "Select an employee"}
                  </option>
                  {employees.map((emp) => (
                    <option
                      key={emp._id}
                      value={emp._id}
                      className="text-slate-900"
                    >
                      {emp.name} {emp.department ? `- ${emp.department}` : ""}
                    </option>
                  ))}
                </select>
              </div>
              {employees.length === 0 && !loadingEmployees && (
                <p className="mt-1 text-xs text-amber-600">
                  No employees available. Ask an admin to create employee
                  accounts.
                </p>
              )}
            </div>
            <div>
              <label htmlFor="purpose" className={labelClass}>
                Purpose of Visit <span className="text-red-500">*</span>
              </label>
              <input
                id="purpose"
                name="purpose"
                type="text"
                value={form.purpose}
                onChange={handleChange}
                placeholder="Interview, meeting, delivery..."
                className={inputClass}
                required
              />
            </div>
            <div>
              <label htmlFor="visitDate" className={labelClass}>
                Visit Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="visitDate"
                  name="visitDate"
                  type="date"
                  min={today}
                  value={form.visitDate}
                  onChange={handleChange}
                  className={`${inputClass} pl-9`}
                  required
                />
              </div>
            </div>
            <div>
              <label htmlFor="expectedArrivalTime" className={labelClass}>
                Expected Arrival Time <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="expectedArrivalTime"
                  name="expectedArrivalTime"
                  type="time"
                  value={form.expectedArrivalTime}
                  onChange={handleChange}
                  className={`${inputClass} pl-9`}
                  required
                />
              </div>
            </div>
          </div>
        </fieldset>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
          <button
            type="button"
            onClick={() => {
              setForm({
                name: "",
                phone: "",
                email: "",
                govtId: "",
                employeeId: "",
                purpose: "",
                visitDate: "",
                expectedArrivalTime: "",
              });
              setError("");
              setSuccess("");
            }}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={submitting || loadingEmployees}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            {submitting ? "Registering..." : "Register Visitor"}
          </button>
        </div>
      </form>
    </div>
  );
}
