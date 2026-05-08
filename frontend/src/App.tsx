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
import CamerierePage from './pages/CamerierePage';
import BarPage from './pages/BarPage';
import PizzeriaPage from './pages/PizzeriaPage';
import PublicPrenotazionePage from './pages/PublicPrenotazionePage';
import PublicTavoloPage from './pages/PublicTavoloPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registrati" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
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
            <Route path="bar" element={<BarPage />} />
            <Route path="pizzeria" element={<PizzeriaPage />} />
            <Route path="sala" element={<CamerierePage />} />
            <Route path="profilo" element={<ProfiloPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
