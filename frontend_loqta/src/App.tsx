import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { Home } from './pages/Home';
import { Products } from './pages/Products';
import { Categories } from './pages/Categories';
import { ProductDetails } from './pages/ProductDetails';
import { Cart } from './pages/Cart';
import { Favorites } from './pages/Favorites';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { Profile } from './pages/Profile';
import { Policies } from './pages/Policies';
import { NotFound } from './pages/NotFound';
import { useAppStore } from './store/useAppStore';

export default function App() {
  const language = useAppStore((state) => state.language);
  const initAuth = useAppStore((state) => state.initAuth);

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  // Restore the session from the backend cookie/bearer token (if any).
  useEffect(() => {
    void initAuth();
  }, [initAuth]);

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-light">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/products/:id" element={<ProductDetails />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/policies" element={<Policies />} />
            <Route path="/policies/:section" element={<Policies />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
