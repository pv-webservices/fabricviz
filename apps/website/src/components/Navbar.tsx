import React, { useState, useEffect } from 'react';
import { Menu, X, Heart, User, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MenuItem {
  name: string;
  href: string;
  submenu?: { name: string; href: string }[];
}

interface HeaderData {
  logo_text: string;
  menu_items: MenuItem[];
}

const MENU_ITEMS_FALLBACK: MenuItem[] = [
  { name: 'HOME', href: '/' },
  { name: 'SOFA', href: '/sofa' },
  { name: 'CURTAIN', href: '/curtain' },
  { name: 'CONTACT', href: '/contact' }
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [headerData, setHeaderData] = useState<{ logo_url: string, menu_items: typeof MENU_ITEMS_FALLBACK }>({
    logo_url: '',
    menu_items: MENU_ITEMS_FALLBACK
  });

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchHeaderData = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/homepage/header`);
        if (!res.ok) throw new Error('Failed to fetch header data');
        const json = await res.json();
        const data = json.success ? json.data : null;
        if (data) {
          setHeaderData({
            logo_url: data.logo_url || '',
            menu_items: data.menu_items && data.menu_items.length > 0 ? data.menu_items : MENU_ITEMS_FALLBACK
          });
        }
      } catch (error) {
        console.error('Error fetching header data:', error);
      }
    };
    fetchHeaderData();
  }, []);

  const isDarkText = isScrolled || mobileMenuOpen;

  return (
    <>
      <nav 
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          isDarkText 
            ? 'bg-white/95 backdrop-blur-xl border-b border-black/5 py-3 md:py-4' 
            : 'bg-transparent py-4 md:py-6 text-white hover:bg-white/90 hover:text-brand-text hover:border-b hover:border-black/5 group transition-colors'
        }`}
      >
        <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-12 flex items-center justify-between">
          
          {/* Mobile Menu Toggle */}
          <button 
            className={`lg:hidden p-2 -ml-2 transition-colors ${!isDarkText ? 'text-white group-hover:text-brand-text' : 'text-brand-text'}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Center/Left Logo */}
          <div className={`transition-colors ${
            !isDarkText ? 'text-white' : 'text-brand-text'
          }`}>
            <a href="/" className="block h-8 md:h-10">
              {headerData.logo_url ? (
                <img src={headerData.logo_url} alt="Logo" className="h-full w-auto object-contain" />
              ) : (
                <span className="font-serif text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tighter">FABRICVIZ</span>
              )}
            </a>
          </div>

          {/* Desktop Navigation */}
          <ul className="hidden lg:flex items-center gap-6 text-[11px] font-semibold tracking-widest uppercase relative">
            {headerData.menu_items.map((menu) => (
              <li key={menu.name} className="py-2 relative group">
                <a 
                  href={menu.href} 
                  className={`transition-colors flex items-center gap-1 hover:text-brand-accent ${!isDarkText ? 'text-white/90 group-hover:text-brand-text' : 'text-brand-text'}`}
                >
                  {menu.name}
                  {menu.submenu && menu.submenu.length > 0 && (
                    <svg className="w-3 h-3 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  )}
                </a>
                
                {/* Desktop Dropdown */}
                {menu.submenu && menu.submenu.length > 0 && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-0 pt-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible min-w-[200px] z-[60]">
                    <div className="bg-white shadow-xl border border-black/5 rounded-sm p-2 flex flex-col gap-1">
                      {menu.submenu.map(sub => (
                        <a 
                          key={sub.name} 
                          href={sub.href} 
                          className="px-4 py-3 text-brand-text hover:text-brand-accent hover:bg-slate-50 transition-colors block whitespace-nowrap"
                        >
                          {sub.name}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>

          {/* Icons & CTAs */}
          <div className="flex items-center gap-2 sm:gap-4 ml-auto lg:ml-4">
            <a href="/favorites" aria-label="Favorites" className={`p-2 transition-colors ${!isDarkText ? 'text-white group-hover:text-brand-text' : 'text-brand-text hover:text-brand-accent'}`}>
              <Heart size={20} />
            </a>
            <a href="/login" aria-label="Sign In" className={`p-2 transition-colors ${!isDarkText ? 'text-white group-hover:text-brand-text' : 'text-brand-text hover:text-brand-accent'}`}>
              <User size={20} />
            </a>
            <a href={import.meta.env.VITE_APP_URL || '/login'} className="hidden sm:inline-flex items-center gap-2 bg-brand-terracotta text-white px-5 py-2 text-[10px] font-bold tracking-widest uppercase rounded-sm transition-colors hover:opacity-90 ml-2">
              <Sparkles size={14} /> VISUALIZER
            </a>
          </div>
        </div>
      </nav>

      {/* Mobile Menu (Simplified) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, x: '-100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '-100%' }}
            transition={{ ease: "easeInOut", duration: 0.3 }}
            className="fixed inset-0 z-40 bg-white pt-20 px-6 overflow-y-auto block lg:hidden"
          >
            <ul className="flex flex-col gap-6 text-lg py-6">
              {headerData.menu_items.map(menu => (
                <li key={menu.name} className="border-b border-black/5 pb-4">
                  <a href={menu.href} className="font-semibold text-brand-text tracking-wider hover:text-brand-accent block w-full">{menu.name}</a>
                  {menu.submenu && menu.submenu.length > 0 && (
                    <ul className="mt-3 pl-4 flex flex-col gap-3 border-l-2 border-brand-accent/20">
                      {menu.submenu.map(sub => (
                        <li key={sub.name}>
                          <a href={sub.href} className="text-base text-brand-muted hover:text-brand-accent block">{sub.name}</a>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
            <div className="mt-4 mb-12">
              <a href={import.meta.env.VITE_APP_URL || '/login'} className="w-full flex justify-center items-center gap-2 bg-brand-terracotta text-white py-4 font-bold tracking-widest text-[10px] uppercase rounded-sm">
                <Sparkles size={14} /> VISUALIZER
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
