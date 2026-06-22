import React from 'react';
import { Facebook, Instagram, Linkedin, MessageCircle } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-brand-dark flex flex-col relative pt-[40px]">
      
      {/* Main Footer Columns */}
      <div className="max-w-[1440px] w-full mx-auto px-4 md:px-8 py-12 md:py-16 text-white/80 border-b border-white/5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-12">
          
          {/* Logo & Info */}
          <div>
             <div className="font-serif text-2xl font-semibold tracking-tighter text-white mb-6">FABRICVIZ</div>
             <p className="text-sm font-light text-white/60 mb-8 max-w-xs md:max-w-[250px] leading-relaxed">
               Premium quality fabrics crafted for the modern luxury interior. Elevate your spaces with our wholesale collections.
             </p>
             <div className="flex gap-4">
               <a href="#" className="text-white/60 hover:text-brand-accent transition-colors"><Instagram size={20} /></a>
               <a href="#" className="text-white/60 hover:text-brand-accent transition-colors"><Facebook size={20} /></a>
               <a href="#" className="text-white/60 hover:text-brand-accent transition-colors"><Linkedin size={20} /></a>
             </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-[10px] font-bold tracking-widest uppercase text-white mb-6">Navigation</h4>
            <ul className="space-y-4 text-sm font-light text-white/60">
              <li><a href="/" className="hover:text-brand-accent transition-colors">Home</a></li>
              <li><a href="/sofa" className="hover:text-brand-accent transition-colors">Sofa</a></li>
              <li><a href="/curtain" className="hover:text-brand-accent transition-colors">Curtain</a></li>
              <li><a href="/about" className="hover:text-brand-accent transition-colors">About Us</a></li>
              <li><a href="/contact" className="hover:text-brand-accent transition-colors">Contact</a></li>
            </ul>
          </div>

          {/* Tools & Account */}
          <div>
            <h4 className="text-[10px] font-bold tracking-widest uppercase text-white mb-6">Tools & Account</h4>
            <ul className="space-y-4 text-sm font-light text-white/60">
              <li><a href={import.meta.env.VITE_APP_URL || '/login'} className="hover:text-brand-accent transition-colors">Visualizer</a></li>
              <li><a href="/favorites" className="hover:text-brand-accent transition-colors">Favorites</a></li>
              <li><a href="/login" className="hover:text-brand-accent transition-colors">Account</a></li>
              <li><a href="#" className="hover:text-brand-accent transition-colors">Install App</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-[10px] font-bold tracking-widest uppercase text-white mb-6">Contact</h4>
            <ul className="space-y-4 text-sm font-light text-white/60 mb-6">
              <li>+91 98 7654 3210</li>
              <li>hello@fabricviz.com</li>
              <li>124 Fabric Street, <br />New Delhi, India 110001</li>
            </ul>
            <a href="#" className="inline-flex items-center justify-center gap-2 bg-[#25D366] text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-[#1fb355] transition-colors">
              <MessageCircle size={18} /> Chat on WhatsApp
            </a>
          </div>

        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-[1440px] w-full mx-auto px-4 md:px-8 py-6 text-white/40 flex flex-col md:flex-row items-center justify-between text-[10px] sm:text-xs font-light tracking-wide gap-4">
        <p className="text-center md:text-left">&copy; {new Date().getFullYear()} Fabricviz Wholesale. All rights reserved.</p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-white transition-colors">Terms of Sale</a>
        </div>
      </div>

    </footer>
  );
}
