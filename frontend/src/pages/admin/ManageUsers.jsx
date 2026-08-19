import { useEffect, useState, useCallback } from "react";
import {
  Users,
  UserPlus,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Mail,
  Building2,
  ShieldCheck,
} from "lucide-react";
import { getUsers } from "../../services/userService";
import { registerUser } from "../../services/authService";

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200";

const labelClass = "mb-1.5 block text-sm font-medium text-slate-700";

const ROLE_STYLES = {
  Employee: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  Receptionist: "bg-green-50 text-green-700 ring-green-200",
  Admin: "bg-purple-50 text-purple-700 ring-purple-200",
};

const EMPTY_FORM = {
  name: "",
  email: "",
  password: "",
  role: "Employee",
  department: "",
};

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const role = filter === "All" ? undefined : filter;
      const data = await getUsers(role);
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to load users. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

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

    const { name, email, password, role, department } = form;
    if (!name || !email || !password) {
      setError("Please fill in name, email, and password.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setSubmitting(true);
    try {
      const created = await registerUser({
        name,
        email,
        password,
        role,
        department,
      });
      setSuccess(`Account created for ${created.name} (${created.role}).`);
      setForm(EMPTY_FORM);
      setFilter(role);
      await fetchUsers();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to create account. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const filteredUsers =
    filter === "All" ? users : users.filter((u) => u.role === filter);

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-900">Manage Users</h2>
        <p className="mt-1 text-sm text-slate-500">
          Create and view Employee and Receptionist accounts.
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

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Create user form */}
        <section className="lg:col-span-2">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900">
              <UserPlus className="h-4 w-4 text-indigo-600" />
              Create Account
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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
                <label htmlFor="email" className={labelClass}>
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="jane@company.com"
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className={labelClass}>
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Min 6 characters"
                  className={inputClass}
                  required
                  minLength={6}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="role" className={labelClass}>
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="role"
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                    className={inputClass}
                    required
                  >
                    <option value="Employee">Employee</option>
                    <option value="Receptionist">Receptionist</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="department" className={labelClass}>
                    Department
                  </label>
                  <input
                    id="department"
                    name="department"
                    type="text"
                    value={form.department}
                    onChange={handleChange}
                    placeholder="Engineering"
                    className={inputClass}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
                {submitting ? "Creating..." : "Create Account"}
              </button>
            </form>
          </div>
        </section>

        {/* User list */}
        <section className="lg:col-span-3">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Users className="h-4 w-4 text-indigo-600" />
                Accounts
              </h3>

              {/* Role filter */}
              <div className="flex overflow-hidden rounded-lg border border-slate-300">
                {["All", "Employee", "Receptionist"].map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => {
                      setFilter(role);
                      setError("");
                    }}
                    className={`px-3 py-1.5 text-xs font-medium transition ${
                      filter === role
                        ? "bg-indigo-600 text-white"
                        : "bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            {/* Loading */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-7 w-7 animate-spin text-indigo-600" />
              </div>
            )}

            {/* Empty */}
            {!loading && filteredUsers.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-12 text-center">
                <Users className="h-10 w-10 text-slate-300" />
                <p className="text-sm font-medium text-slate-600">
                  No accounts found
                </p>
                <p className="text-sm text-slate-400">
                  {filter === "All"
                    ? "Create your first account to get started."
                    : `No ${filter.toLowerCase()} accounts yet.`}
                </p>
              </div>
            )}

            {/* User list */}
            {!loading && filteredUsers.length > 0 && (
              <ul className="divide-y divide-slate-100">
                {filteredUsers.map((user) => (
                  <li
                    key={user._id}
                    className="flex items-center justify-between gap-4 py-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium text-slate-900">
                          {user.name}
                        </p>
                        <span
                          className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                            ROLE_STYLES[user.role] ||
                            "bg-slate-100 text-slate-600 ring-slate-200"
                          }`}
                        >
                          <ShieldCheck className="h-3 w-3" />
                          {user.role}
                        </span>
                      </div>
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                        <Mail className="h-3.5 w-3.5" />
                        <span className="truncate">{user.email}</span>
                      </p>
                      {user.department && (
                        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                          <Building2 className="h-3.5 w-3.5" />
                          {user.department}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
