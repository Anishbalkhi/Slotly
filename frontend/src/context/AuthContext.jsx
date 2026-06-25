import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('bookease_token');
    const savedUser = localStorage.getItem('bookease_user');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('bookease_token');
        localStorage.removeItem('bookease_user');
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { user: userData, token: newToken } = res.data.data;

    localStorage.setItem('bookease_token', newToken);
    localStorage.setItem('bookease_user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);

    return userData;
  }, []);

  const signup = useCallback(async (name, email, password, role) => {
    const res = await api.post('/auth/signup', { name, email, password, role });
    const { user: userData, token: newToken } = res.data.data;

    localStorage.setItem('bookease_token', newToken);
    localStorage.setItem('bookease_user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);

    return userData;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('bookease_token');
    localStorage.removeItem('bookease_user');
    setToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((updatedData) => {
    const updated = { ...user, ...updatedData };
    setUser(updated);
    localStorage.setItem('bookease_user', JSON.stringify(updated));
  }, [user]);

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token,
    isOwner: user?.role === 'owner',
    isCustomer: user?.role === 'customer',
    login,
    signup,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
