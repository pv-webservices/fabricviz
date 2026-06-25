import React, { useRef, useState } from 'react';
import { motion, useInView } from 'motion/react';
import { MapPin, Phone, Mail, Clock, Instagram, Linkedin, Twitter, CheckCircle2 } from 'lucide-react';

export default function Contact() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-10%" });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    window.location.href = `mailto:hello@fabricviz.com?subject=Enquiry from Website`;
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 5000); // Reset after 5s
  }

  return (
    <section id="contact" className="bg-brand-bg py-16 md:py-24 pb-24 md:pb-32" ref={ref}>
      <div className="max-w-[1200px] mx-auto px-4 md:px-8 flex flex-col lg:flex-row gap-12 lg:gap-24">
        
        {/* Left Side */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
          transition={{ duration: 0.6 }}
          className="lg:w-[40%] flex flex-col"
        >
          <div className="text-brand-accent tracking-widest text-[10px] font-bold mb-3 uppercase">
            Let's Talk
          </div>
          <h2 className="font-serif text-3xl md:text-5xl text-brand-text mb-4 lg:mb-6">Get in Touch</h2>
          <p className="text-brand-muted text-base md:text-lg font-light mb-8 lg:mb-12">
            Whether you're a designer, retailer, or interior decorator — 
            we're here to help you find the perfect fabric.
          </p>

          <div className="space-y-6 flex-grow">
            <div className="flex items-start gap-4">
              <MapPin className="text-brand-accent mt-1 flex-shrink-0" size={20} strokeWidth={1} />
              <div>
                <strong className="block text-brand-text font-medium mb-1 tracking-wide text-[10px] uppercase">Showroom</strong>
                <span className="text-brand-muted font-light text-sm md:text-base">124 Fabric Street, Design District<br/>New Delhi, India 110001</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Phone className="text-brand-accent flex-shrink-0" size={20} strokeWidth={1} />
              <span className="text-brand-muted font-light text-sm md:text-base">+91 98 7654 3210</span>
            </div>
            <div className="flex items-center gap-4">
              <Mail className="text-brand-accent flex-shrink-0" size={20} strokeWidth={1} />
              <span className="text-brand-muted font-light text-sm md:text-base">hello@fabricviz.com</span>
            </div>
            <div className="flex items-center gap-4">
              <Clock className="text-brand-accent flex-shrink-0" size={20} strokeWidth={1} />
              <span className="text-brand-muted font-light text-sm md:text-base">Mon–Sat: 10:00 AM – 7:00 PM</span>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-8 lg:mt-12 pt-8 border-t border-black/5">
            <a href="#" className="w-10 h-10 border border-black/5 flex items-center justify-center text-brand-text hover:bg-brand-accent hover:text-white transition-colors">
              <Instagram size={18} strokeWidth={1.5} />
            </a>
            <a href="#" className="w-10 h-10 border border-black/5 flex items-center justify-center text-brand-text hover:bg-brand-accent hover:text-white transition-colors">
              <Linkedin size={18} strokeWidth={1.5} />
            </a>
            <a href="#" className="w-10 h-10 border border-black/5 flex items-center justify-center text-brand-text hover:bg-brand-accent hover:text-white transition-colors">
              <Twitter size={18} strokeWidth={1.5} />
            </a>
          </div>
        </motion.div>

        {/* Right Side: Form */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="lg:w-[60%]"
        >
          <div className="bg-white rounded-none p-6 sm:p-8 md:p-12 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] md:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] border border-black/5 relative overflow-hidden">
            
            {/* Success State Overlay */}
            {submitted && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-white z-10 flex flex-col items-center justify-center text-center p-8"
              >
                <CheckCircle2 className="w-16 h-16 text-brand-accent mb-6 stroke-[1]" />
                <h3 className="font-serif text-3xl mb-2">Thank You</h3>
                <p className="text-brand-muted text-sm md:text-base">We've received your enquiry and will contact you within 24 hours.</p>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="flex flex-col">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-brand-muted mb-2">Full Name *</label>
                  <input required type="text" className="bg-brand-bg border text-sm border-black/5 rounded-sm px-4 py-3 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all" />
                </div>
                <div className="flex flex-col">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-brand-muted mb-2">Email Address *</label>
                  <input required type="email" className="bg-brand-bg border text-sm border-black/5 rounded-sm px-4 py-3 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all" />
                </div>
              </div>
              
              <div className="flex flex-col">
                <label className="text-[10px] font-bold uppercase tracking-widest text-brand-muted mb-2">Phone Number</label>
                <input type="tel" className="bg-brand-bg border text-sm border-black/5 rounded-sm px-4 py-3 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="flex flex-col">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-brand-muted mb-2">Fabric Interest</label>
                  <select className="bg-brand-bg border text-sm border-black/5 rounded-sm px-4 py-3 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all appearance-none cursor-pointer w-full bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22currentColor%22%3E%3Cpath%20d%3D%22M5.293%207.293a1%201%200%20011.414%200L10%2010.586l3.293-3.293a1%201%200%20111.414%201.414l-4%204a1%201%200%2001-1.414%200l-4-4a1%201%200%20010-1.414z%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_1rem_center] bg-[length:1.2em_1.2em]">
                    <option>Sofa Upholstery</option>
                    <option>Curtains</option>
                    <option>Sheer</option>
                    <option>Outdoor</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-brand-muted mb-2">Order Quantity</label>
                  <select className="bg-brand-bg border text-sm border-black/5 rounded-sm px-4 py-3 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all appearance-none cursor-pointer w-full bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22currentColor%22%3E%3Cpath%20d%3D%22M5.293%207.293a1%201%200%20011.414%200L10%2010.586l3.293-3.293a1%201%200%20111.414%201.414l-4%204a1%201%200%2001-1.414%200l-4-4a1%201%200%20010-1.414z%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_1rem_center] bg-[length:1.2em_1.2em]">
                    <option>Sample Only</option>
                    <option>50–200m</option>
                    <option>200–500m</option>
                    <option>500m+</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col">
                <label className="text-[10px] font-bold uppercase tracking-widest text-brand-muted mb-2">Message / Project Description</label>
                <textarea rows={4} className="bg-brand-bg border text-sm border-black/5 rounded-sm px-4 py-3 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all resize-none"></textarea>
              </div>

              <div className="flex items-center gap-3 mt-4">
                <input required type="checkbox" id="privacy" className="w-4 h-4 text-brand-accent border-gray-300 rounded-sm focus:ring-brand-accent accent-brand-accent flex-shrink-0" />
                <label htmlFor="privacy" className="text-[13px] text-brand-muted font-light leading-snug">
                  I agree to the <a href="#" className="underline">privacy policy</a>
                </label>
              </div>

              <button type="submit" className="w-full bg-brand-accent text-white px-8 py-4 text-[10px] font-bold tracking-widest uppercase hover:bg-yellow-700 transition-colors mt-6">
                Send Enquiry
              </button>
            </form>
          </div>
        </motion.div>
        
      </div>
    </section>
  );
}
