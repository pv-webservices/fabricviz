import { Toaster } from '@/components/ui/toaster';
import Link from 'next/link';
import { Home, Image as ImageIcon, History } from 'lucide-react';

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[100dvh] w-full flex-col bg-brand-bg overflow-hidden pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]">
      <header className="flex h-14 shrink-0 items-center justify-center border-b border-black/5 bg-white px-4 shadow-sm z-10">
        <h1 className="text-xl font-bold tracking-tight text-brand-text font-serif uppercase tracking-widest">FabricViz</h1>
      </header>
      
      <main className="flex-1 overflow-y-auto w-full max-w-md mx-auto bg-brand-bg relative">
        {children}
      </main>

      <nav className="h-16 shrink-0 border-t border-black/5 bg-white z-10 w-full">
        <div className="flex h-full w-full max-w-md mx-auto items-center justify-around">
          <Link href="/fabrics" className="flex flex-col items-center gap-1 text-brand-muted hover:text-brand-accent">
            <Home className="h-5 w-5" />
            <span className="text-[10px] font-medium">Fabrics</span>
          </Link>
          <Link href="/rooms" className="flex flex-col items-center gap-1 text-brand-muted hover:text-brand-accent">
            <ImageIcon className="h-5 w-5" />
            <span className="text-[10px] font-medium">Rooms</span>
          </Link>
          <Link href="/history" className="flex flex-col items-center gap-1 text-brand-muted hover:text-brand-accent">
            <History className="h-5 w-5" />
            <span className="text-[10px] font-medium">History</span>
          </Link>
        </div>
      </nav>
      <Toaster />
    </div>
  );
}
