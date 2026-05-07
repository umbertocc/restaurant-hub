import { NavLink, useNavigate } from 'react-router-dom';
import React from 'react';
import {
  LayoutDashboard,
  UtensilsCrossed,
  ShoppingCart,
  Calendar,
  Wine,
  Settings,
  LogOut,
  ChefHat,
  TableProperties,
  Utensils,
  ShieldCheck,
} from 'lucide-react';
import { useAuth, Profilo } from '../context/AuthContext';

const ALL_NAV_ITEMS: { path: string; label: string; icon: React.ElementType; profili: Profilo[] }[] = [
  { path: '/',             label: 'Dashboard',    icon: LayoutDashboard, profili: ['admin'] },
  { path: '/menu',         label: 'Menu',         icon: UtensilsCrossed, profili: ['admin'] },
  { path: '/ordini',       label: 'Ordini',       icon: ShoppingCart,    profili: ['admin', 'cameriere'] },
  { path: '/tavoli',       label: 'Tavoli',       icon: TableProperties, profili: ['admin', 'cameriere'] },
  { path: '/prenotazioni', label: 'Prenotazioni', icon: Calendar,        profili: ['admin'] },
  { path: '/abbinamenti',  label: 'Abbinamenti',  icon: Wine,            profili: ['admin'] },
  { path: '/cucina',       label: 'Cucina',       icon: ChefHat,         profili: ['admin', 'cuoco'] },
  { path: '/sala',         label: 'Sala',         icon: Utensils,        profili: ['admin', 'cameriere'] },
  { path: '/profilo',      label: 'Profilo',      icon: Settings,        profili: ['admin'] },
];

const PROFILI: { value: Profilo; label: string; color: string; activeColor: string }[] = [
  { value: 'admin',     label: 'Admin',     color: 'bg-gray-700 text-gray-200 hover:bg-gray-600', activeColor: 'bg-red-600 text-white' },
  { value: 'cameriere', label: 'Cameriere', color: 'bg-gray-700 text-gray-200 hover:bg-gray-600', activeColor: 'bg-indigo-600 text-white' },
  { value: 'cuoco',     label: 'Cuoco',     color: 'bg-gray-700 text-gray-200 hover:bg-gray-600', activeColor: 'bg-amber-600 text-white' },
];

// Redirect di default per ogni profilo
const PROFILO_HOME: Record<Profilo, string> = {
  admin:     '/',
  cameriere: '/sala',
  cuoco:     '/cucina',
};

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const { ristorante, logout, profilo, setProfilo } = useAuth();
  const navigate = useNavigate();

  const navItems = ALL_NAV_ITEMS.filter((item) => item.profili.includes(profilo));

  const handleSetProfilo = (p: Profilo) => {
    setProfilo(p);
    navigate(PROFILO_HOME[p]);
    onClose?.();
  };

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col h-full flex-shrink-0">
      {/* Brand */}
      <div className="p-5 border-b border-gray-700/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <ChefHat className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-white leading-tight">Restaurant Hub</p>
            <p className="text-xs text-gray-400 truncate">{ristorante?.nome ?? 'Admin'}</p>
          </div>
        </div>
      </div>

      {/* Selettore profilo */}
      <div className="px-3 pt-3 pb-1">
        <p className="text-xs text-gray-500 uppercase tracking-wider px-1 mb-1.5 flex items-center gap-1">
          <ShieldCheck className="w-3 h-3" /> Vista
        </p>
        <div className="flex gap-1">
          {PROFILI.map(({ value, label, color, activeColor }) => (
            <button
              key={value}
              onClick={() => handleSetProfilo(value)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                profilo === value ? activeColor : color
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-red-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="p-3 border-t border-gray-700/60">
        <div className="flex items-center gap-2.5 mb-2 px-2">
          <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
            {ristorante?.nome?.[0]?.toUpperCase() ?? 'R'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{ristorante?.nome}</p>
            <p className="text-xs text-gray-400 truncate">{ristorante?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Esci
        </button>
      </div>
    </aside>
  );
}

