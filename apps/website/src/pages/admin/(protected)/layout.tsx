import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Toaster } from '@/components/ui/toaster';

export default function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full bg-brand-bg overflow-hidden">
      <div className="hidden md:flex md:flex-col">
        <AdminSidebar />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminHeader />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
      <Toaster />
    </div>
  );
}
