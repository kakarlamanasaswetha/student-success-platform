import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { loginUser, registerUser, fetchMe } from '../api/endpoints';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('ssp_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('ssp_token');
    if (!token) {
      setLoading(false);
      return;
    }
    fetchMe()
      .then(({ data }) => {
        setUser(data.user);
        localStorage.setItem('ssp_user', JSON.stringify(data.user));
      })
      .catch(() => {
        localStorage.removeItem('ssp_token');
        localStorage.removeItem('ssp_user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const persistSession = (token, userData) => {
    localStorage.setItem('ssp_token', token);
    localStorage.setItem('ssp_user', JSON.stringify(userData));
    setUser(userData);
  };

  const login = useCallback(async (email, password) => {
    const { data } = await loginUser({ email, password });
    persistSession(data.token, data.user);
    return data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const { data } = await registerUser(payload);
    persistSession(data.token, data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('ssp_token');
    localStorage.removeItem('ssp_user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
