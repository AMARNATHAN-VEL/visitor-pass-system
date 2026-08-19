import api from "./api";

/**
 * Register a new visitor and create a visit request.
 * @param {Object} payload
 * @param {string} payload.name
 * @param {string} payload.phone
 * @param {string} [payload.email]
 * @param {string} payload.govtId
 * @param {string} payload.employeeId
 * @param {string} payload.purpose
 * @param {string} payload.visitDate - YYYY-MM-DD
 * @param {string} payload.expectedArrivalTime - HH:MM (24h)
 * @returns {Promise<{ visitRequest: Object, visitor: Object }>}
 */
export const registerVisitor = async (payload) => {
  const response = await api.post("/visitors/register", payload);
  return response.data.data;
};

/**
 * Approve or reject a visit request (Employee only).
 * @param {string} id - Visit request id
 * @param {'Approved' | 'Rejected'} status
 * @param {string} [remarks]
 * @returns {Promise<Object>}
 */
export const updateVisitStatus = async (id, status, remarks = "") => {
  const response = await api.patch(`/visitors/${id}/status`, {
    status,
    remarks,
  });
  return response.data.data;
};

/**
 * Check in a visitor (Receptionist only).
 * @param {string} id - Visit request id.
 * @returns {Promise<Object>}
 */
export const checkInVisitor = async (id) => {
  const response = await api.patch(`/visitors/${id}/check-in`);
  return response.data.data;
};

/**
 * Check out a visitor (Receptionist only).
 * @param {string} id - Visit request id.
 * @returns {Promise<Object>}
 */
export const checkOutVisitor = async (id) => {
  const response = await api.patch(`/visitors/${id}/check-out`);
  return response.data.data;
};

/**
 * Get pending visit requests for the logged-in employee.
 * @returns {Promise<Array<Object>>}
 */
export const getPendingVisits = async () => {
  const response = await api.get("/visitors/pending");
  return response.data.data;
};

/**
 * Get active visits (excludes Cancelled) with optional database-side filters.
 * @param {Object} [filters]
 * @returns {Promise<Array<Object>>}
 */
export const getActiveVisits = async (filters = {}) => {
  const params = Object.fromEntries(
    Object.entries(filters).filter(
      ([key, value]) =>
        value &&
        !(key === "status" && value === "All") &&
        !(key === "department" && value === "All"),
    ),
  );
  const response = await api.get("/visitors/active", { params });
  return response.data.data;
};

/**
 * Apply a batch action to visit requests.
 * @param {string[]} ids - Visit request ids.
 * @param {'approve' | 'checkOut'} action
 * @returns {Promise<{ matchedCount: number, modifiedCount: number }>}
 */
export const bulkVisitorAction = async (ids, action) => {
  const response = await api.post("/visitors/bulk-action", { ids, action });
  return response.data.data;
};
