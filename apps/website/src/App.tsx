import React from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import Navbar from './components/Navbar';
import Contact from './components/Contact';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import CategoryPage from './pages/CategoryPage';
import CatalogPage from './pages/CatalogPage';
import { CustomerAuthProvider } from './context/CustomerAuthContext';
import { AdminAuthProvider } from './context/AdminAuthContext';
import AdminLayout from './pages/admin/AdminLayout';

// Admin Pages
import AdminLoginPage from './pages/admin/login/page';
import AdminDashboardPage from './pages/admin/(protected)/dashboard/page';
import AdminCustomersPage from './pages/admin/(protected)/customers/page';
import AdminCollectionsPage from './pages/admin/(protected)/collections/page';
import AdminFabricsPage from './pages/admin/(protected)/collections/[id]/fabrics/page';
import AdminRoomsPage from './pages/admin/(protected)/rooms/page';
import AdminHomepagePage from './pages/admin/(protected)/homepage/page';

import FavoritesPage from './pages/FavoritesPage';
import VisualizerPage from './pages/VisualizerPage';

function PublicLayout() {
  return (
    <>
      <Navbar />
      <Outlet />
      <Contact />
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <AdminAuthProvider>
      <CustomerAuthProvider>
        <BrowserRouter>
          <ScrollToTop />
          <div className="w-full min-h-screen bg-brand-bg text-brand-text font-sans">
            <Routes>
              {/* Public Routes with Navbar and Footer */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/sofa" element={<CategoryPage endUse="sofa" />} />
                <Route path="/curtain" element={<CategoryPage endUse="curtain" />} />
                <Route path="/category/:endUse" element={<CategoryPage endUse="" />} />
                <Route path="/catalog/:id" element={<CatalogPage />} />
                <Route path="/collections/:id" element={<CatalogPage />} />
                <Route path="/favorites" element={<FavoritesPage />} />
              </Route>

              {/* Fullscreen Routes (No Navbar/Footer) */}
              <Route path="/visualizer" element={<VisualizerPage />} />

              {/* Admin Routes */}
              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route path="dashboard" element={<AdminDashboardPage />} />
                <Route path="customers" element={<AdminCustomersPage />} />
                <Route path="collections" element={<AdminCollectionsPage />} />
                <Route path="collections/:id/fabrics" element={<AdminFabricsPage />} />
                <Route path="rooms" element={<AdminRoomsPage />} />
                <Route path="homepage" element={<AdminHomepagePage />} />
              </Route>
            </Routes>
          </div>
        </BrowserRouter>
      </CustomerAuthProvider>
    </AdminAuthProvider>
  );
}
