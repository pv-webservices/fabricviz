import React, { createContext, useContext, useState, useEffect } from 'react';

interface Customer {
  id: string;
  full_name: string;
  email: string;
  mobile: string;
  country_code: string;
  company?: string;
  city?: string;
}

interface Fabric {
  id: string;
  title: string;
  image_url: string;
  collection_name: string;
  code: string;
  category: string;
}

interface CustomerAuthContextType {
  customer: Customer | null;
  favorites: string[];
  favoriteFabrics: Fabric[];
  isAuthenticated: boolean;
  loading: boolean;
  login: (customer: Customer, token: string) => void;
  logout: () => void;
  toggleFavorite: (fabricId: string) => Promise<void>;
  fetchFavorites: () => Promise<void>;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

export function CustomerAuthProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favoriteFabrics, setFavoriteFabrics] = useState<Fabric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      const token = localStorage.getItem('customer_token');
      if (token) {
        try {
          const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
          const res = await fetch(`${API_URL}/api/auth/customer/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await res.json();
          if (data.success) {
            setCustomer(data.data);
            await fetchFavorites();
          } else {
            localStorage.removeItem('customer_token');
          }
        } catch (err) {
          console.error('Auth check failed', err);
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const fetchFavorites = async () => {
    const token = localStorage.getItem('customer_token');
    if (!token) return;
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const res = await fetch(`${API_URL}/api/customer/favorites`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setFavoriteFabrics(data.data);
        setFavorites(data.data.map((f: Fabric) => f.id));
      }
    } catch (err) {
      console.error('Failed to fetch favorites', err);
    }
  };

  const login = (customerData: Customer, token: string) => {
    localStorage.setItem('customer_token', token);
    setCustomer(customerData);
    fetchFavorites();
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('customer_token');
      if (token) {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
        await fetch(`${API_URL}/api/auth/customer/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (err) {
      console.error('Logout failed', err);
    } finally {
      localStorage.removeItem('customer_token');
      setCustomer(null);
      setFavorites([]);
      setFavoriteFabrics([]);
    }
  };

  const toggleFavorite = async (fabricId: string) => {
    if (!customer) return;
    const token = localStorage.getItem('customer_token');
    const isFavorited = favorites.includes(fabricId);
    
    // Optimistic UI update
    if (isFavorited) {
      setFavorites(prev => prev.filter(id => id !== fabricId));
      setFavoriteFabrics(prev => prev.filter(f => f.id !== fabricId));
    } else {
      setFavorites(prev => [...prev, fabricId]);
      // We'll refetch to get the full fabric data for the drawer
    }

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const res = await fetch(`${API_URL}/api/customer/favorites/${fabricId}`, {
        method: isFavorited ? 'DELETE' : 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!data.success) {
        // Revert optimistic update
        await fetchFavorites();
      } else if (!isFavorited) {
        // Need to refetch to get the full fabric object for favoriteFabrics array
        await fetchFavorites();
      }
    } catch (err) {
      console.error('Toggle favorite failed', err);
      // Revert optimistic update
      await fetchFavorites();
    }
  };

  return (
    <CustomerAuthContext.Provider value={{
      customer,
      favorites,
      favoriteFabrics,
      isAuthenticated: !!customer,
      loading,
      login,
      logout,
      toggleFavorite,
      fetchFavorites
    }}>
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  const context = useContext(CustomerAuthContext);
  if (context === undefined) {
    throw new Error('useCustomerAuth must be used within a CustomerAuthProvider');
  }
  return context;
}
