import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { Ristorante, LoginRequest } from '../types';
import { login as apiLogin } from '../api/ristoranti';
import { startOrdersRealtime, stopOrdersRealtime } from '../realtime/ordersRealtime';

export type Profilo = 'admin' | 'cameriere' | 'cuoco' | 'barista' | 'pizzaiolo';

interface AuthContextValue {
  token: string | null;
  ristorante: Ristorante | null;
  ruoli: string[];
  login: (data: LoginRequest) => Promise<void>;
  logout: () => void;
  refreshRistorante: (r: Ristorante) => void;
  isAuthenticated: boolean;
  newOrderAlert: boolean;
  dismissOrderAlert: () => void;
  profilo: Profilo;
  setProfilo: (p: Profilo) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem('rh_token'),
  );
  const [ristorante, setRistorante] = useState<Ristorante | null>(() => {
    const stored = localStorage.getItem('rh_ristorante');
    return stored ? (JSON.parse(stored) as Ristorante) : null;
  });
  const [ruoli, setRuoli] = useState<string[]>(() => {
    const stored = localStorage.getItem('rh_ruoli');
    return stored ? JSON.parse(stored) : [];
  });
  const [newOrderAlert, setNewOrderAlert] = useState(false);
  const [profilo, setProfiloState] = useState<Profilo>(
    () => (localStorage.getItem('rh_profilo') as Profilo) ?? 'admin'
  );

  const setProfilo = useCallback((p: Profilo) => {
    localStorage.setItem('rh_profilo', p);
    setProfiloState(p);
  }, []);

  useEffect(() => {
    const ristoranteId = ristorante?.id;
    if (!token || !ristoranteId) {
      stopOrdersRealtime();
      return;
    }

    startOrdersRealtime({
      token,
      ristoranteId,
      onOrderChanged: () => {
        setNewOrderAlert(true);
        window.setTimeout(() => setNewOrderAlert(false), 5000);
      },
    });

    return () => {
      stopOrdersRealtime();
    };
  }, [token, ristorante?.id]);

  const login = useCallback(async (data: LoginRequest) => {
    const response = await apiLogin(data);
    localStorage.setItem('rh_token', response.token);
    localStorage.setItem('rh_ristorante', JSON.stringify(response.ristorante));
    localStorage.setItem('rh_ruoli', JSON.stringify(response.ruoli));
    setToken(response.token);
    setRistorante(response.ristorante);
    setRuoli(response.ruoli);
  }, []);

  const logout = useCallback(() => {
    stopOrdersRealtime();
    localStorage.removeItem('rh_token');
    localStorage.removeItem('rh_ristorante');
    localStorage.removeItem('rh_ruoli');
    setToken(null);
    setRistorante(null);
    setRuoli([]);
  }, []);

  const refreshRistorante = useCallback((r: Ristorante) => {
    localStorage.setItem('rh_ristorante', JSON.stringify(r));
    setRistorante(r);
  }, []);

  const dismissOrderAlert = useCallback(() => setNewOrderAlert(false), []);

  return (
    <AuthContext.Provider
      value={{ token, ristorante, ruoli, login, logout, refreshRistorante, isAuthenticated: !!token, newOrderAlert, dismissOrderAlert, profilo, setProfilo }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
