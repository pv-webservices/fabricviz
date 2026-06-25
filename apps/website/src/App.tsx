import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import Navbar from './components/Navbar';
import Contact from './components/Contact';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import CategoryPage from './pages/CategoryPage';
import CatalogPage from './pages/CatalogPage';
import { CustomerAuthProvider } from './context/CustomerAuthContext';

export default function App() {
  return (
    <CustomerAuthProvider>
      <BrowserRouter>
        <ScrollToTop />
      <div className="w-full min-h-screen bg-brand-bg text-brand-text font-sans">
        <Navbar />
        
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/sofa" element={<CategoryPage endUse="sofa" />} />
          <Route path="/curtain" element={<CategoryPage endUse="curtain" />} />
          {/* Keep dynamic category route just in case other items like rug/wallpaper are clicked via generic paths */}
          <Route path="/category/:endUse" element={<CategoryPage endUse="" />} />
          <Route path="/catalog/:id" element={<CatalogPage />} />
          <Route path="/collections/:id" element={<CatalogPage />} />
        </Routes>

        <Contact />
        <Footer />
      </div>
      </BrowserRouter>
    </CustomerAuthProvider>
  );
}
