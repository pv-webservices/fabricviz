import React from 'react';
import { Facebook, Instagram, Twitter, Linkedin, MessageCircle } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-brand-dark flex flex-col relative pt-[40px]">
      
      {/* Newsletter Floating Bar (overlapping previous section visually) */}
      <div className="mx-4 md:mx-8 -mt-24 mb-12 md:mb-16 relative z-10">
        <div className="max-w-[1200px] mx-auto bg-[#2c2416] text-white p-6 sm:p-8 md:p-12 md:px-16 rounded-lg shadow-xl flex flex-col lg:flex-row items-center justify-between gap-6 md:gap-8 border border-white/5">
          <div className="max-w-md text-center lg:text-left">
            <h3 className="font-serif text-2xl md:text-3xl mb-2">Stay Inspired</h3>
            <p className="text-white/70 font-light text-sm md:text-base">New Collections, Design Trends & Exclusive Offers straight to your inbox.</p>
          </div>
          <div className="w-full lg:w-auto flex-1 max-w-md flex flex-col sm:flex-row gap-2">
            <input 
              type="email" 
              placeholder="Enter your email" 
              className="w-full bg-white/5 border border-white/20 rounded-sm px-4 py-3 focus:outline-none focus:border-brand-accent text-white placeholder:text-white/40"
            />
            <button className="w-full sm:w-auto bg-brand-accent text-white px-8 py-3 rounded-sm font-bold tracking-widest text-[10px] uppercase hover:bg-yellow-700 transition-colors whitespace-nowrap">
              Subscribe
            </button>
          </div>
        </div>
      </div>

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
              <li><a href="#" className="hover:text-brand-accent transition-colors">Home</a></li>
              <li><a href={import.meta.env.VITE_APP_URL || 'http://localhost:3000'} className="hover:text-brand-accent transition-colors">Shop Products</a></li>
              <li><a href={import.meta.env.VITE_APP_URL || 'http://localhost:3000'} className="hover:text-brand-accent transition-colors">Collections by Look</a></li>
              <li><a href="#" className="hover:text-brand-accent transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-brand-accent transition-colors">Blog & Design Guides</a></li>
              <li><a href="#" className="hover:text-brand-accent transition-colors">Contact</a></li>
            </ul>
          </div>

          {/* About */}
          <div>
            <h4 className="text-[10px] font-bold tracking-widest uppercase text-white mb-6">About Fabricviz</h4>
            <ul className="space-y-4 text-sm font-light text-white/60">
              <li><a href="#" className="hover:text-brand-accent transition-colors">Our Story</a></li>
              <li><a href="#" className="hover:text-brand-accent transition-colors">Collaborating Designers</a></li>
              <li><a href="#" className="hover:text-brand-accent transition-colors">Sustainability Promise</a></li>
              <li><a href="#" className="hover:text-brand-accent transition-colors">Trade Program</a></li>
              <li><a href="#" className="hover:text-brand-accent transition-colors">Press & Media</a></li>
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
