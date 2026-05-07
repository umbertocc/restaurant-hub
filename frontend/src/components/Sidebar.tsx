import { NavLink } from 'react-router-dom';
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
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/menu', label: 'Menu', icon: UtensilsCrossed },
  { path: '/ordini', label: 'Ordini', icon: ShoppingCart },
  { path: '/tavoli', label: 'Tavoli', icon: TableProperties },
  { path: '/prenotazioni', label: 'Prenotazioni', icon: Calendar },
  { path: '/abbinamenti', label: 'Abbinamenti', icon: Wine },
  { path: '/cucina', label: 'Cucina', icon: ChefHat },
  { path: '/sala', label: 'Sala', icon: Utensils },
  { path: '/profilo', label: 'Profilo', icon: Settings },
];

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const { ristorante, logout } = useAuth();

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
