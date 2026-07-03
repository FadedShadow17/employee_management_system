import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '../services/api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('ems_token');
    if (!token) {
      setLoading(false);
      return;
    }
    api.get('/auth/me')
      .then((res) => setUser(res.data.data))
      .catch(() => localStorage.removeItem('ems_token'))
      .finally(() => setLoading(false));
  }, []);

  const login = async (payload) => {
    const { data } = await api.post('/auth/login', payload);

    // If MFA is required, return the temp token for the MFA verification step
    if (data.mfaRequired) {
      return { mfaRequired: true, tempToken: data.tempToken };
    }

    localStorage.setItem('ems_token', data.token);
    setUser(data.user);
    toast.success('Welcome back');
    return { mfaRequired: false };
  };

  const signup = async (payload) => {
    const { data } = await api.post('/auth/signup', payload);
    localStorage.setItem('ems_token', data.token);
    setUser(data.user);
    toast.success('Account created');
  };

  const logout = () => {
    localStorage.removeItem('ems_token');
    setUser(null);
    toast.success('Logged out');
  };

  const value = useMemo(() => ({ user, loading, login, signup, logout, setUser }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
