import React, { useState, useEffect } from 'react';
import { Search, ShoppingCart, Menu, X, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const MENU_ITEMS = [
  {
    name: 'COLLECTIONS',
    items: ['Sofa Upholstery Fabrics', 'Curtain & Drapery Fabrics', 'Sheer & Voile Fabrics', 'Outdoor & Performance Fabrics', 'New Arrivals'],
    image: 'https://images.unsplash.com/photo-1584598173971-b7bcc74b4815?q=80&w=1000&auto=format&fit=crop',
  },
  {
    name: 'FABRIC TYPE',
    items: ['Velvet & Chenille', 'Linen & Cotton Blends', 'Jacquard & Brocade', 'Blackout & Thermal', 'Faux Leather & Suede'],
    image: 'https://images.unsplash.com/photo-1605721911519-3dfeb3be25e7?q=80&w=1000&auto=format&fit=crop',
  },
  {
    name: 'COLLECTIONS BY LOOK',
    items: ['Modern Minimalist', 'Classic Heritage', 'Coastal & Boho', 'Earthy & Organic', 'Bold & Dramatic'],
    image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=1000&auto=format&fit=crop',
  },
  {
    name: 'RESOURCES',
    items: ['Fabric Care Guide', 'Measurement Calculator', 'Sample Request', 'Inspiration Gallery', 'Trade Program'],
  },
  {
    name: 'ABOUT US',
    items: ['Our Story', 'Sustainability', 'Certifications', 'Wholesale/B2B'],
  },
  {
    name: 'CONTACT',
    items: [],
  }
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isDarkText = isScrolled || activeMenu !== null || mobileMenuOpen;

  return (
    <>
      <nav 
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          isDarkText 
            ? 'bg-white/95 backdrop-blur-xl border-b border-black/5 py-3 md:py-4' 
            : 'bg-transparent py-4 md:py-6 text-white hover:bg-white/90 hover:text-brand-text hover:border-b hover:border-black/5 group transition-colors'
        }`}
        onMouseLeave={() => setActiveMenu(null)}
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
            FABRICVIZ
          </div>

          {/* Desktop Navigation */}
          <ul className="hidden lg:flex items-center gap-6 text-[11px] font-semibold tracking-widest uppercase">
            {MENU_ITEMS.map((menu) => (
              <li 
                key={menu.name}
                onMouseEnter={() => setActiveMenu(menu.items.length > 0 ? menu.name : null)}
                className="py-2 cursor-pointer transition-colors hover:text-brand-accent relative"
              >
                <div className={`transition-colors ${!isDarkText ? 'text-white/90 group-hover:text-brand-text' : 'text-brand-muted'}`}>
                  {menu.name}
                </div>
              </li>
            ))}
          </ul>

          {/* Icons & CTAs */}
          <div className="flex items-center gap-2 sm:gap-4 ml-auto lg:ml-4">
            <button aria-label="Search" className={`p-2 transition-colors ${!isDarkText ? 'text-white group-hover:text-brand-text' : 'text-brand-text hover:text-brand-accent'}`}>
              <Search size={20} />
            </button>
            <button aria-label="Cart" className={`p-2 transition-colors ${!isDarkText ? 'text-white group-hover:text-brand-text' : 'text-brand-text hover:text-brand-accent'}`}>
              <ShoppingCart size={20} />
            </button>
            <a href={import.meta.env.VITE_APP_URL || 'http://localhost:3000'} className="hidden sm:inline-flex items-center bg-brand-terracotta text-white px-5 py-2 text-[10px] font-bold tracking-widest uppercase rounded-sm transition-colors hover:opacity-90 ml-2">
              Open Visualizer
            </a>
          </div>
        </div>

        {/* Mega Menu Dropdown */}
        <AnimatePresence>
          {activeMenu && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="absolute top-full left-0 w-full bg-white text-brand-text border-t border-black/5 shadow-lg hidden lg:block"
              onMouseEnter={() => setActiveMenu(activeMenu)}
            >
              <div className="max-w-[1440px] mx-auto px-12 py-12 flex">
                <div className="w-1/2 flex flex-col gap-4">
                  <h3 className="text-xl font-serif text-brand-muted mb-4">{activeMenu}</h3>
                  <ul className="grid grid-cols-2 gap-x-8 gap-y-4">
                    {MENU_ITEMS.find(m => m.name === activeMenu)?.items.map((item) => (
                      <li key={item}>
                        <a href="#" className="text-sm hover:text-brand-accent transition-colors flex items-center group/link">
                          <span className="w-0 overflow-hidden group-hover/link:w-4 transition-all duration-300">
                            <ChevronRight size={14} />
                          </span>
                          {item}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="w-1/2 flex justify-end">
                  {MENU_ITEMS.find(m => m.name === activeMenu)?.image && (
                    <div className="w-[400px] h-[250px] overflow-hidden rounded-sm bg-gray-100">
                      <img 
                        src={MENU_ITEMS.find(m => m.name === activeMenu)?.image} 
                        alt={activeMenu} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
                  <span className="font-semibold text-brand-text tracking-wider">{menu.name}</span>
                  {menu.items.length > 0 && (
                     <ul className="mt-4 flex flex-col gap-3 pl-4">
                       {menu.items.map(item => (
                         <li key={item} className="text-brand-muted text-sm flex items-center gap-2">
                           <ChevronRight size={14} className="text-brand-accent/50" />
                           {item}
                         </li>
                       ))}
                     </ul>
                  )}
                </li>
              ))}
            </ul>
            <div className="mt-4 mb-12">
              <a href={import.meta.env.VITE_APP_URL || 'http://localhost:3000'} className="w-full inline-block text-center bg-brand-terracotta text-white py-4 font-bold tracking-widest text-[10px] uppercase rounded-sm">
                Open Visualizer
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
