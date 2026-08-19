import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertCircle, BarChart3, Loader2 } from "lucide-react";
import { getVisitorAnalytics } from "../services/reportService";

const STATUS_COLORS = ["#16a34a", "#64748b"];

export default function VisitorAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadAnalytics = async () => {
      try {
        const data = await getVisitorAnalytics();
        if (active) setAnalytics(data);
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.error ||
              err.response?.data?.message ||
              "Unable to load visitor analytics.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadAnalytics();
    return () => {
      active = false;
    };
  }, []);

  const statusData = analytics
    ? [
        { name: "Checked-In", value: analytics.statusCounts.CheckedIn || 0 },
        { name: "Checked-Out", value: analytics.statusCounts.CheckedOut || 0 },
      ]
    : [];

  return (
    <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <BarChart3 className="h-4 w-4 text-indigo-600" />
            Visitor Analytics
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Traffic and visit status over the last seven days.
          </p>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-indigo-600" />
        </div>
      )}

      {!loading && error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {!loading && !error && analytics && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(240px,0.9fr)]">
          <div className="h-72 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={analytics.traffic}
                margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#64748b", fontSize: 12 }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                />
                <Tooltip cursor={{ fill: "#eef2ff" }} />
                <Bar
                  dataKey="count"
                  name="Visitors"
                  fill="#4f46e5"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="h-72 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={58}
                  outerRadius={88}
                  paddingAngle={3}
                  stroke="none"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={entry.name} fill={STATUS_COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={28} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </section>
  );
}
