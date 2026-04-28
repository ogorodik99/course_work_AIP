import React, { createContext, useContext, useState, useEffect } from 'react';
import { checkSession, login as apiLogin, register as apiRegister, logout as apiLogout } from '../api/index';

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const data = await checkSession();
      if (data.authorized) {
        setUser({
          id: data.user_id,
          name: data.full_name || data.username,
          email: data.username,
          role: data.role,
        });
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function login(email, password) {
    const data = await apiLogin(email, password);
    if (data.success && data.user) {
      setUser({
        id: data.user.id,
        name: data.user.full_name || data.user.username,
        email: data.user.email,
        role: data.user.role,
      });
    }
    return data;
  }

  async function register(name, email, password) {
    const data = await apiRegister(name, email, password);
    if (data.success && data.user) {
      setUser({
        id: data.user.id,
        name: data.user.full_name || data.user.username,
        email: data.user.email,
        role: data.user.role,
      });
    }
    return data;
  }

  async function logout() {
    try {
      await apiLogout();
    } catch {
      // ignore
    }
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}
