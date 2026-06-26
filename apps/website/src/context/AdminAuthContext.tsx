import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAuthToken, getAuthUser, setAuthToken, setAuthUser as setAuthUserCookie, removeAuthToken } from '../lib/auth';

interface AdminUser {
  userId: string;
  email: string;
  role: string;
}

interface AdminAuthContextType {
  adminUser: AdminUser | null;
  adminToken: string | null;
  isAdminAuthenticated: boolean;
  login: (user: AdminUser, token: string) => void;
  logout: () => void;
  loading: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAuthToken();
    const user = getAuthUser();
    
    if (token && user && user.role) {
      setAdminToken(token);
      setAdminUser(user);
    } else {
      removeAuthToken();
    }
    setLoading(false);
  }, []);

  const login = (user: AdminUser, token: string) => {
    setAuthToken(token);
    setAuthUserCookie(user);
    setAdminToken(token);
    setAdminUser(user);
  };

  const logout = () => {
    removeAuthToken();
    setAdminToken(null);
    setAdminUser(null);
  };

  return (
    <AdminAuthContext.Provider value={{
      adminUser,
      adminToken,
      isAdminAuthenticated: !!adminToken,
      login,
      logout,
      loading
    }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}
