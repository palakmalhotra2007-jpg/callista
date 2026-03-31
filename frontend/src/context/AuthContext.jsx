import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('pb_token');
    if (!token) { setLoading(false); return; }
    axios.get('/api/auth/me', { headers: { Authorization: 'Bearer ' + token } })
      .then(res => setUser(res.data.user))
      .catch(() => localStorage.removeItem('pb_token'))
      .finally(() => setLoading(false));
  }, []);

  function loginUser(token, userData) {
    localStorage.setItem('pb_token', token);
    setUser(userData);
  }

  function logout() {
    localStorage.removeItem('pb_token');
    sessionStorage.removeItem('pb_pin_ok');
    setUser(null);
  }

  const value = { user, setUser, loginUser, logout, loading };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
