import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, Heart, User, Sparkles, LogOut, LayoutDashboard } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import AuthModal from './AuthModal';
import { useCustomerAuth } from '../context/CustomerAuthContext';

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

const getLinkHref = (name: string, fallback: string) => {
  const upper = name.toUpperCase();
  if (upper === 'HOME') return '/';
  if (upper === 'CONTACT') return '/#contact';
  if (upper === 'SOFA') return '/sofa';
  if (upper === 'CURTAIN') return '/curtain';
  return fallback || '/';
};

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [headerData, setHeaderData] = useState<{ logo_url: string, menu_items: typeof MENU_ITEMS_FALLBACK }>({
    logo_url: '',
    menu_items: MENU_ITEMS_FALLBACK
  });
  const [loading, setLoading] = useState(true);

  const { isAuthenticated, customer, logout, favorites } = useCustomerAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      } finally {
        setLoading(false);
      }
    };
    fetchHeaderData();
  }, []);

  const isDarkText = 
    isScrolled || 
    mobileMenuOpen || 
    location.pathname.startsWith('/category/') || 
    location.pathname === '/sofa' || 
    location.pathname === '/curtain' ||
    location.pathname === '/visualizer' ||
    location.pathname === '/favorites';

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
            <a href="/" className="block h-12 md:h-16">
              {loading ? (
                <div className="h-full w-48 bg-white/10 animate-pulse rounded" />
              ) : headerData.logo_url ? (
                <img src={headerData.logo_url} alt="Logo" className="h-full w-auto object-contain" />
              ) : (
                <span className="font-serif text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tighter">FABRICVIZ</span>
              )}
            </a>
          </div>

          {/* Desktop Navigation */}
          <ul className="hidden lg:flex items-center gap-6 text-[11px] font-semibold tracking-widest uppercase relative">
            {headerData.menu_items.map((menu) => (
              <li key={menu.name} className="relative group/navitem">
                <Link 
                  to={getLinkHref(menu.name, menu.href)}
                  onClick={(e) => {
                    if (menu.name.toUpperCase() === 'CONTACT') {
                      if (window.location.pathname === '/') {
                        e.preventDefault();
                        document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                      }
                    } else if (menu.name.toUpperCase() === 'HOME') {
                      if (window.location.pathname === '/') {
                        e.preventDefault();
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }
                  }}
                  className={`transition-colors flex items-center gap-1 hover:text-brand-accent ${!isDarkText ? 'text-white/90 group-hover:text-brand-text' : 'text-brand-text'}`}
                >
                  {menu.name}
                  {menu.submenu && menu.submenu.length > 0 && (
                    <svg className="w-3 h-3 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  )}
                </Link>
                
                {/* Desktop Dropdown */}
                {menu.submenu && menu.submenu.length > 0 && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-0 pt-4 opacity-0 invisible group-hover/navitem:opacity-100 group-hover/navitem:visible min-w-[200px] z-[60]">
                    <div className="bg-white shadow-xl border border-black/5 rounded-sm p-2 flex flex-col gap-1">
                      <Link 
                        to={getLinkHref(menu.name, menu.href)}
                        className="px-4 py-3 bg-[#f5c73c] text-slate-900 font-semibold hover:bg-[#eab308] transition-colors block whitespace-nowrap rounded-t-sm"
                      >
                        View all {menu.name}
                      </Link>
                      {menu.submenu.map(sub => (
                        <Link 
                          key={sub.name} 
                          to={sub.href} 
                          className="px-4 py-3 text-brand-text hover:text-brand-accent hover:bg-slate-50 transition-colors block whitespace-nowrap"
                        >
                          {sub.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>

          {/* Icons & CTAs */}
          <div className="flex items-center gap-2 sm:gap-4 ml-auto lg:ml-4">
            <button 
              onClick={() => isAuthenticated ? navigate('/favorites') : setAuthModalOpen(true)}
              aria-label="Favorites" 
              className={`relative p-2 transition-colors ${!isDarkText ? 'text-white group-hover:text-brand-text' : 'text-brand-text hover:text-brand-accent'}`}
            >
              <Heart size={20} className={favorites.length > 0 ? "fill-brand-terracotta text-brand-terracotta" : ""} />
              {favorites.length > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-brand-terracotta text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {favorites.length}
                </span>
              )}
            </button>
            
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => isAuthenticated ? setUserDropdownOpen(!userDropdownOpen) : setAuthModalOpen(true)}
                aria-label="Account" 
                className={`p-2 transition-colors ${!isDarkText ? 'text-white group-hover:text-brand-text' : 'text-brand-text hover:text-brand-accent'}`}
              >
                <User size={20} />
              </button>

              {/* User Dropdown */}
              <AnimatePresence>
                {isAuthenticated && userDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-48 bg-white shadow-xl border border-brand-dark/10 rounded-lg overflow-hidden py-2 text-brand-dark z-50"
                  >
                    <div className="px-4 py-2 border-b border-brand-dark/5">
                      <p className="text-xs text-brand-dark/50 font-semibold uppercase tracking-wider mb-0.5">Signed in as</p>
                      <p className="text-sm font-medium truncate">{customer?.full_name}</p>
                    </div>
                    <button onClick={() => { setUserDropdownOpen(false); navigate('/favorites'); }} className="w-full text-left px-4 py-2 text-sm hover:bg-brand-dark/5 flex items-center gap-2 transition-colors">
                      <Heart size={16} /> My Favorites
                    </button>
                    <button onClick={() => { setUserDropdownOpen(false); navigate('/visualizer'); }} className="w-full text-left px-4 py-2 text-sm hover:bg-brand-dark/5 flex items-center gap-2 transition-colors">
                      <LayoutDashboard size={16} /> AI Visualizer
                    </button>
                    <button onClick={() => { setUserDropdownOpen(false); logout(); }} className="w-full text-left px-4 py-2 text-sm text-brand-terracotta hover:bg-brand-terracotta/5 flex items-center gap-2 transition-colors border-t border-brand-dark/5 mt-1 pt-3">
                      <LogOut size={16} /> Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link to="/visualizer" className="hidden sm:inline-flex items-center gap-2 bg-brand-terracotta text-white px-5 py-2 text-[10px] font-bold tracking-widest uppercase rounded-sm transition-colors hover:opacity-90 ml-2">
              <Sparkles size={14} /> VISUALIZER
            </Link>
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
                  <Link 
                    to={getLinkHref(menu.name, menu.href)} 
                    onClick={(e) => {
                      if (menu.name.toUpperCase() === 'CONTACT') {
                        if (window.location.pathname === '/') {
                          e.preventDefault();
                          document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                        }
                      } else if (menu.name.toUpperCase() === 'HOME') {
                        if (window.location.pathname === '/') {
                          e.preventDefault();
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                      }
                      setMobileMenuOpen(false);
                    }}
                    className="font-semibold text-brand-text tracking-wider hover:text-brand-accent block w-full"
                  >
                    {menu.name}
                  </Link>
                  {menu.submenu && menu.submenu.length > 0 && (
                    <ul className="mt-3 pl-4 flex flex-col gap-3 border-l-2 border-brand-accent/20">
                      <li>
                        <Link to={getLinkHref(menu.name, menu.href)} onClick={() => setMobileMenuOpen(false)} className="text-base text-brand-terracotta font-semibold hover:text-brand-accent block">View all {menu.name}</Link>
                      </li>
                      {menu.submenu.map(sub => (
                        <li key={sub.name}>
                          <Link to={sub.href} onClick={() => setMobileMenuOpen(false)} className="text-base text-brand-muted hover:text-brand-accent block">{sub.name}</Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
            <div className="mt-4 mb-12">
              <Link to="/visualizer" onClick={() => setMobileMenuOpen(false)} className="w-full flex justify-center items-center gap-2 bg-brand-terracotta text-white py-4 font-bold tracking-widest text-[10px] uppercase rounded-sm">
                <Sparkles size={14} /> VISUALIZER
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  );
}
