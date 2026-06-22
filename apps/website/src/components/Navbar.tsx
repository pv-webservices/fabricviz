import React, { useState, useEffect } from 'react';
import { Menu, X, Heart, User, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const MENU_ITEMS = [
  { name: 'HOME', href: '/' },
  { name: 'SOFA', href: '/sofa' },
  { name: 'CURTAIN', href: '/curtain' },
  { name: 'CONTACT', href: '/contact' }
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
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
          <div className={`font-serif text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tighter transition-colors ${
            !isDarkText ? 'text-white' : 'text-brand-text'
          }`}>
            <a href="/">FABRICVIZ</a>
          </div>

          {/* Desktop Navigation */}
          <ul className="hidden lg:flex items-center gap-6 text-[11px] font-semibold tracking-widest uppercase">
            {MENU_ITEMS.map((menu) => (
              <li key={menu.name} className="py-2">
                <a 
                  href={menu.href} 
                  className={`transition-colors hover:text-brand-accent ${!isDarkText ? 'text-white/90 group-hover:text-brand-text' : 'text-brand-text'}`}
                >
                  {menu.name}
                </a>
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
              {MENU_ITEMS.map(menu => (
                <li key={menu.name} className="border-b border-black/5 pb-4">
                  <a href={menu.href} className="font-semibold text-brand-text tracking-wider hover:text-brand-accent block w-full">{menu.name}</a>
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
