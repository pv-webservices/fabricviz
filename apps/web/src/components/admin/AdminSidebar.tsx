'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Layers, 
  Palette, 
  Image as ImageIcon, 
  Users, 
  Inbox, 
  CreditCard, 
  BarChart3, 
  HardDrive, 
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Collections', href: '/admin/collections', icon: Layers },
  { name: 'Rooms', href: '/admin/rooms', icon: ImageIcon },
  { name: 'Customers', href: '/admin/customers', icon: Users },
  { name: 'Requests', href: '/admin/requests', icon: Inbox },
  { name: 'Credits', href: '/admin/credits', icon: CreditCard },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { name: 'Storage', href: '/admin/storage', icon: HardDrive },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col bg-slate-900 border-r border-slate-800">
      <div className="flex h-16 shrink-0 items-center px-6">
        <span className="text-xl font-bold text-white tracking-tight">FabricViz <span className="text-blue-500">Admin</span></span>
      </div>
      <div className="flex flex-1 flex-col overflow-y-auto">
        <nav className="flex-1 space-y-1 px-4 py-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  isActive
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white',
                  'group flex items-center rounded-md px-2 py-2 text-sm font-medium transition-colors'
                )}
              >
                <item.icon
                  className={cn(
                    isActive ? 'text-blue-500' : 'text-slate-400 group-hover:text-blue-500',
                    'mr-3 h-5 w-5 shrink-0 transition-colors'
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
