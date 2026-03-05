import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import Login from './pages/Login';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import UserList from './pages/Users/UserList';
import UserForm from './pages/Users/UserForm';
import CategoryList from './pages/Categories/CategoryList';
import CategoryForm from './pages/Categories/CategoryForm';
import ItemForm from './pages/Categories/ItemForm';
import SocialNetList from './pages/SocialNets/SocialNetList';
import SocialNetForm from './pages/SocialNets/SocialNetForm';
import SocialPostList from './pages/SocialPosts/SocialPostList';
import SocialPostForm from './pages/SocialPosts/SocialPostForm';
import AgendaPage from './pages/Agenda/AgendaPage';
import IngredientsPage from './pages/Ingredients/IngredientsPage';
import RecipeList from './pages/Recipes/RecipeList';
import RecipeForm from './pages/Recipes/RecipeForm';
import ClientList from './pages/Clients/ClientList';
import QuotationList from './pages/Quotations/QuotationList';
import QuotationForm from './pages/Quotations/QuotationForm';
import InvoiceList from './pages/Accounting/InvoiceList';
import InvoiceForm from './pages/Accounting/InvoiceForm';
import WebContentPage from './pages/WebContent/WebContentPage';
import CalculatorProductsPage from './pages/CalculatorProducts/CalculatorProductsPage';
import { useAuthStore } from './store/authStore';
import React from 'react';



const ProtectedRoute = ({ children }: { children: React.JSX.Element }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/" />;
};

import { ThemeProvider, CssBaseline } from '@mui/material';
import { createAppTheme } from './theme/theme';
import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';

function App() {
  const { t, i18n } = useTranslation();

  const theme = useMemo(() => {
    return createAppTheme(t);
  }, [i18n.language, t]);

  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <CssBaseline />
      <Toaster position="top-right" />
        <Router>
          <Routes>
            <Route path="/" element={<Login />} />
            
            {/* Protected Dashboard Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="users" element={<UserList />} />
              <Route path="users/new" element={<UserForm />} />
              <Route path="users/:id" element={<UserForm />} />

              {/* Portfolio / Categories */}
              <Route path="portfolio" element={<CategoryList />} />
              <Route path="portfolio/new" element={<CategoryForm />} />
              <Route path="portfolio/items/new" element={<ItemForm />} />
              <Route path="portfolio/items/:id" element={<ItemForm />} />
              <Route path="portfolio/:id" element={<CategoryForm />} />

              {/* Social Networks */}
              <Route path="social-nets" element={<SocialNetList />} />
              <Route path="social-nets/new" element={<SocialNetForm />} />
              <Route path="social-nets/:id" element={<SocialNetForm />} />

              {/* Social Posts */}
              <Route path="social-posts" element={<SocialPostList />} />
              <Route path="social-posts/new" element={<SocialPostForm />} />
              <Route path="social-posts/:id" element={<SocialPostForm />} />

              {/* Agenda */}
              <Route path="agenda" element={<AgendaPage />} />

              {/* Ingredients & Metrics */}
              <Route path="ingredients" element={<IngredientsPage />} />

              {/* Recipes */}
              <Route path="recipes" element={<RecipeList />} />
              <Route path="recipes/new" element={<RecipeForm />} />
              <Route path="recipes/:id" element={<RecipeForm />} />

              {/* Clients */}
              <Route path="clients" element={<ClientList />} />

              {/* Quotations */}
              <Route path="quotations" element={<QuotationList />} />
              <Route path="quotations/new" element={<QuotationForm />} />
              <Route path="quotations/:id" element={<QuotationForm />} />
              <Route path="quotations/:id/edit" element={<QuotationForm />} />

              {/* Accounting */}
              <Route path="accounting" element={<InvoiceList />} />
              <Route path="accounting/new" element={<InvoiceForm />} />
              <Route path="accounting/:id" element={<InvoiceForm />} />
              <Route path="accounting/:id/edit" element={<InvoiceForm />} />

              {/* Web Content Management */}
              <Route path="web-content" element={<WebContentPage />} />

              {/* Calculator Products */}
              <Route path="calculator-products" element={<CalculatorProductsPage />} />
            </Route>
          </Routes>
        </Router>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
