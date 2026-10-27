import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { adminGetMe } from '../services/adminApi';

const AdminContext = createContext(null);

export function AdminProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshAdmin = useCallback(async () => {
    try {
      const res = await adminGetMe();
      if (res && res.success && res.admin) {
        setAdmin(res.admin);
      }
    } catch (err) {
      // Silently retain fallback on error without throwing
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAdmin();
  }, [refreshAdmin]);

  const updateAdmin = useCallback((updatedData) => {
    if (updatedData) {
      setAdmin((prev) => ({ ...(prev || {}), ...updatedData }));
    }
  }, []);

  return (
    <AdminContext.Provider value={{ admin, loading, updateAdmin, refreshAdmin }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  return context || { admin: null, loading: false, updateAdmin: () => {}, refreshAdmin: () => {} };
}
