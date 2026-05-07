import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import MenuPage from './pages/MenuPage';
import OrdiniPage from './pages/OrdiniPage';
import OrdineDetailPage from './pages/OrdineDetailPage';
import PrenotazioniPage from './pages/PrenotazioniPage';
import AbbinamentiPage from './pages/AbbinamentiPage';
import ProfiloPage from './pages/ProfiloPage';
import TavoliPage from './pages/TavoliPage';
import CucinaPage from './pages/CucinaPage';
import PublicPrenotazionePage from './pages/PublicPrenotazionePage';
import PublicTavoloPage from './pages/PublicTavoloPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registrati" element={<RegisterPage />} />
          <Route path="/prenota/:ristoranteId" element={<PublicPrenotazionePage />} />
          <Route path="/tavolo/:ristoranteId/:tavoloId" element={<PublicTavoloPage />} />

          {/* Protected */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="menu" element={<MenuPage />} />
            <Route path="ordini" element={<OrdiniPage />} />
            <Route path="ordini/:id" element={<OrdineDetailPage />} />
            <Route path="tavoli" element={<TavoliPage />} />
            <Route path="prenotazioni" element={<PrenotazioniPage />} />
            <Route path="abbinamenti" element={<AbbinamentiPage />} />
            <Route path="cucina" element={<CucinaPage />} />
            <Route path="profilo" element={<ProfiloPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
