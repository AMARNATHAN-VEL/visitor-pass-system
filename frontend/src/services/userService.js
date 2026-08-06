import api from './api';

/**
 * Get all users, optionally filtered by role.
 * @param {string} [role] - 'Admin' | 'Receptionist' | 'Employee'
 * @returns {Promise<Array<Object>>}
 */
export const getUsers = async (role) => {
  const params = role ? { role } : {};
  const response = await api.get('/users', { params });
  return response.data.data;
};