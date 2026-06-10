import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { newOrderAlert, dismissOrderAlert, trialExpired, trialDaysLeft } = useAuth();

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {newOrderAlert && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white px-6 py-3 rounded-xl shadow-lg font-semibold flex items-center gap-3 animate-bounce cursor-pointer"
          onClick={dismissOrderAlert}
        >
          🔔 Nuovo ordine ricevuto!
          <span className="text-xs opacity-75">(tocca per chiudere)</span>
        </div>
      )}
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-30 transform transition-transform duration-200 lg:relative lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-gray-900 text-white flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="p-1">
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-bold text-sm">Restaurant Hub</span>
        </header>

        <main className="flex-1 overflow-y-auto">
          {trialDaysLeft !== null && (
            <div
              className={`mx-4 mt-4 rounded-xl border px-4 py-3 text-sm font-medium ${
                trialExpired
                  ? 'border-amber-300 bg-amber-50 text-amber-900'
                  : trialDaysLeft <= 7
                  ? 'border-orange-300 bg-orange-50 text-orange-900'
                  : 'border-emerald-300 bg-emerald-50 text-emerald-900'
              }`}
            >
              {trialExpired
                ? 'Trial scaduto: account in sola lettura. Effettua upgrade per continuare a modificare i dati.'
                : `Trial attivo: ${trialDaysLeft} giorni rimanenti.`}
              {(trialExpired || trialDaysLeft <= 7) && (
                <Link
                  to="/abbonamento"
                  className="ml-3 inline-flex items-center rounded-lg bg-gray-900 px-3 py-1 text-xs font-semibold text-white hover:bg-black"
                >
                  Attiva abbonamento
                </Link>
              )}
            </div>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
