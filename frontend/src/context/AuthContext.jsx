import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { loginUser as loginRequest } from '../services/authService';

const AuthContext = createContext(null);

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem(USER_KEY);
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(false);

  // Persist token and user whenever they change.
  useEffect(() => {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  }, [user]);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const data = await loginRequest({ email, password });
      setToken(data.token);
      setUser({
        _id: data._id,
        name: data.name,
        email: data.email,
        role: data.role,
        department: data.department,
      });
      return data;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated: Boolean(token && user),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}