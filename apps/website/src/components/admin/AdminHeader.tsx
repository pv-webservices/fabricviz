import { useNavigate } from "react-router-dom";
import { Menu, LogOut, User } from 'lucide-react';
import { removeAuthToken } from '@/lib/auth';
import { fetchApi } from '@/lib/api';

export function AdminHeader() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await fetchApi('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout failed on server', err);
    } finally {
      removeAuthToken();
      navigate('/admin/login');
    }
  };

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-black/5 bg-white px-6">
      <div className="flex items-center">
        {/* Mobile menu toggle goes here if needed later */}
      </div>
      <div className="flex items-center gap-x-4">
        <div className="flex items-center gap-2 text-sm font-medium text-brand-text">
          <User className="h-4 w-4" />
          <span>Admin</span>
        </div>
        <div className="h-6 w-px bg-black/10" />
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm font-medium text-brand-muted hover:text-brand-terracotta transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </header>
  );
}
