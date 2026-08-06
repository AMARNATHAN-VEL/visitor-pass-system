import api from './api';

/**
 * Get admin dashboard metrics.
 * @returns {Promise<{ pendingRequests: number, todayVisitors: number, visitorsInside: number, totalEmployees: number }>}
 */
export const getDashboardMetrics = async () => {
  const response = await api.get('/reports/dashboard');
  return response.data.data;
};