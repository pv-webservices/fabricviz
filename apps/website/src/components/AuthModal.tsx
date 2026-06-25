import React, { useState } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { validateFullName, validateEmail, validateMobile, validatePassword } from '../utils/validation';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultView?: 'signin' | 'signup' | 'forgot-password';
}

export default function AuthModal({ isOpen, onClose, defaultView = 'signin' }: AuthModalProps) {
  const [view, setView] = useState<'signin' | 'signup' | 'forgot-password'>(defaultView);
  const { login } = useCustomerAuth();

  const [formData, setFormData] = useState({
    full_name: '', email: '', password: '', mobile: '', company: '', city: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    
    if (view === 'signup') {
      const nameErr = validateFullName(formData.full_name);
      if (nameErr) return setError(nameErr);
      const mobileErr = validateMobile(formData.mobile);
      if (mobileErr) return setError(mobileErr);
      const emailErr = validateEmail(formData.email);
      if (emailErr) return setError(emailErr);
      const passErr = validatePassword(formData.password);
      if (passErr) return setError(passErr);
    } else if (view === 'signin' || view === 'forgot-password') {
      const emailErr = validateEmail(formData.email);
      if (emailErr) return setError(emailErr);
    }

    setLoading(true);

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      if (view === 'signin') {
        const res = await fetch(`${API_URL}/api/auth/customer/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email, password: formData.password })
        });
        const data = await res.json();
        if (data.success) {
          login(data.data.customer, data.data.token);
          onClose();
        } else {
          setError(data.message || 'Login failed');
        }
      } else if (view === 'signup') {
        const res = await fetch(`${API_URL}/api/auth/customer/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        const data = await res.json();
        if (data.success) {
          login(data.data.customer, data.data.token);
          onClose();
        } else {
          setError(data.message || 'Registration failed');
        }
      } else if (view === 'forgot-password') {
        const res = await fetch(`${API_URL}/api/auth/customer/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email })
        });
        const data = await res.json();
        if (data.success) {
          setMessage(data.data.message);
        } else {
          setError(data.message || 'Failed to request password reset');
        }
      }
    } catch (err) {
      setError('A network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-brand-dark/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-[400px] bg-brand-dark text-brand-bg rounded-lg shadow-2xl border border-white/10 overflow-hidden animate-in fade-in zoom-in-95 duration-200 m-4">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8">
          <h2 className="font-serif text-2xl font-medium text-center mb-6">
            {view === 'signin' && 'Sign In to FabricViz'}
            {view === 'signup' && 'Create an Account'}
            {view === 'forgot-password' && 'Reset Password'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {view === 'signup' && (
              <>
                <div>
                  <input
                    type="text"
                    name="full_name"
                    placeholder="Full Name *"
                    value={formData.full_name}
                    onChange={handleChange}
                    className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-sm focus:outline-none focus:border-brand-accent transition-colors text-white placeholder:text-white/40"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    name="mobile"
                    placeholder="Mobile Number *"
                    value={formData.mobile}
                    onChange={handleChange}
                    className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-sm focus:outline-none focus:border-brand-accent transition-colors text-white placeholder:text-white/40"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    name="company"
                    placeholder="Company (Optional)"
                    value={formData.company}
                    onChange={handleChange}
                    className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-sm focus:outline-none focus:border-brand-accent transition-colors text-white placeholder:text-white/40"
                  />
                  <input
                    type="text"
                    name="city"
                    placeholder="City (Optional)"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-sm focus:outline-none focus:border-brand-accent transition-colors text-white placeholder:text-white/40"
                  />
                </div>
              </>
            )}

            <div>
              <input
                type="email"
                name="email"
                placeholder="Email Address *"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-sm focus:outline-none focus:border-brand-accent transition-colors text-white placeholder:text-white/40"
              />
            </div>

            {view !== 'forgot-password' && (
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Password *"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-sm focus:outline-none focus:border-brand-accent transition-colors text-white placeholder:text-white/40 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            )}

            {error && <p className="text-brand-terracotta text-xs font-medium text-center">{error}</p>}
            {message && <p className="text-brand-accent text-xs font-medium text-center">{message}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-accent text-brand-dark font-medium py-3 rounded text-sm hover:bg-brand-accent/90 transition-colors disabled:opacity-50"
            >
              {loading ? 'Please wait...' : view === 'signin' ? 'Sign In' : view === 'signup' ? 'Create Account' : 'Send Reset Link'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10 text-center text-sm text-white/60">
            {view === 'signin' && (
              <>
                <button onClick={() => setView('forgot-password')} className="hover:text-white transition-colors block w-full mb-2">
                  Forgot your password?
                </button>
                Don't have an account?{' '}
                <button onClick={() => setView('signup')} className="text-brand-accent hover:text-white transition-colors">
                  Sign up
                </button>
              </>
            )}
            {view === 'signup' && (
              <>
                Already have an account?{' '}
                <button onClick={() => setView('signin')} className="text-brand-accent hover:text-white transition-colors">
                  Sign in
                </button>
              </>
            )}
            {view === 'forgot-password' && (
              <>
                Remember your password?{' '}
                <button onClick={() => setView('signin')} className="text-brand-accent hover:text-white transition-colors">
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
