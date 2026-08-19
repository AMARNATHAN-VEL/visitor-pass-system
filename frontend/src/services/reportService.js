import api from "./api";

/**
 * Get admin dashboard metrics.
 * @returns {Promise<{ pendingRequests: number, todayVisitors: number, visitorsInside: number, totalEmployees: number }>}
 */
export const getDashboardMetrics = async () => {
  const response = await api.get("/reports/dashboard");
  return response.data.data;
};

/**
 * Get visitor traffic and status analytics for the last seven days.
 * @returns {Promise<{ traffic: Array, statusCounts: Object }>}
 */
export const getVisitorAnalytics = async () => {
  const response = await api.get("/reports/analytics");
  return response.data.data;
};
