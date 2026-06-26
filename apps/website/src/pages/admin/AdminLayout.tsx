import React from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { Toaster } from '../../components/ui/toaster';

export default function AdminLayout() {
  const { isAdminAuthenticated, loading } = useAdminAuth();
  const location = useLocation();

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-brand-bg">Loading...</div>;
  }

  if (!isAdminAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return (
    <div className="flex h-screen w-full bg-brand-bg overflow-hidden text-brand-text">
      <div className="hidden md:flex md:flex-col h-full bg-brand-dark">
        <AdminSidebar />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminHeader />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-brand-bg">
          <Outlet />
        </main>
      </div>
      <Toaster />
    </div>
  );
}
