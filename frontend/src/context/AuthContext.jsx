import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, setAuthToken, removeAuthToken, getAuthToken } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const token = getAuthToken();
      if (token) {
        try {
          const profile = await api.getMe();
          setUser(profile);
        } catch (err) {
          console.warn('Session expired or invalid, logging out:', err);
          removeAuthToken();
          setUser(null);
        }
      }
      setLoading(false);
    }
    checkAuth();
  }, []);

  const login = async (username, password) => {
    const data = await api.login(username, password);
    setAuthToken(data.access_token);
    setUser({
      id: data.user_id,
      username: data.username,
      full_name: data.full_name,
      role: data.role,
      department: data.department
    });
    return data;
  };

  const logout = () => {
    removeAuthToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      role: user?.role || 'guest',
      isAuthenticated: !!user,
      loading,
      login,
      logout,
      setUser
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
