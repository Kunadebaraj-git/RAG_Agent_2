import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getMe } from '../api';

interface User {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  setAuth: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  setAuth: () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

const DEFAULT_USER: User = {
  id: 'default',
  email: 'guest@docmind.ai',
  full_name: 'DocMind User',
  created_at: new Date().toISOString(),
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(DEFAULT_USER);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token') || 'docmind-guest-token');
  const [loading, setLoading] = useState(false);

  const fetchUser = useCallback(async () => {
    try {
      const { data } = await getMe();
      if (data) {
        setUser(data);
      }
    } catch {
      // Keep default user if request fails
      setUser(DEFAULT_USER);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const setAuth = (newToken: string) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken('docmind-guest-token');
    setUser(DEFAULT_USER);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, setAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

