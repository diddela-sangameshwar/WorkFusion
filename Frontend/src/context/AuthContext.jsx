import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('wf_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const res = await authAPI.getMe();
          setUser(res.data.data.user);
        } catch {
          logout();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { user: userData, token: newToken } = res.data.data;
    localStorage.setItem('wf_token', newToken);
    localStorage.setItem('wf_user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
    return userData;
  };

  const register = async (data) => {
    const res = await authAPI.register(data);
    const { user: userData, token: newToken } = res.data.data;
    localStorage.setItem('wf_token', newToken);
    localStorage.setItem('wf_user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('wf_token');
    localStorage.removeItem('wf_user');
    setToken(null);
    setUser(null);
  };

  const isAdmin = user?.role === 'admin';
  const isHR = user?.role === 'hr';
  const isEmployee = user?.role === 'employee';
  const isManagement = isAdmin || isHR;

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, register, logout, isAdmin, isHR, isEmployee, isManagement }}
    >
      {children}
    </AuthContext.Provider>
  );
};
