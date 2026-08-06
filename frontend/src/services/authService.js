import api from './api';

/**
 * Authenticate a user with email and password.
 * @param {{ email: string, password: string }} credentials
 * @returns {Promise<{ _id: string, name: string, email: string, role: string, department: string, token: string }>}
 */
export const loginUser = async ({ email, password }) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data.data;
};

/**
 * Register a new user (Admin only).
 * @param {{ name: string, email: string, password: string, role: string, department?: string }} userData
 * @returns {Promise<{ _id: string, name: string, email: string, role: string, department: string, token: string }>}
 */
export const registerUser = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data.data;
};