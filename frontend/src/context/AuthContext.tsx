import {
  createContext,
  useCallback,
  useContext,
  useState,
  ReactNode,
} from 'react';
import { Ristorante, LoginRequest } from '../types';
import { login as apiLogin } from '../api/ristoranti';

interface AuthContextValue {
  token: string | null;
  ristorante: Ristorante | null;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => void;
  refreshRistorante: (r: Ristorante) => void;
  isAuthenticated: boolean;
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

  const login = useCallback(async (data: LoginRequest) => {
    const response = await apiLogin(data);
    localStorage.setItem('rh_token', response.token);
    localStorage.setItem('rh_ristorante', JSON.stringify(response.ristorante));
    setToken(response.token);
    setRistorante(response.ristorante);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('rh_token');
    localStorage.removeItem('rh_ristorante');
    setToken(null);
    setRistorante(null);
  }, []);

  const refreshRistorante = useCallback((r: Ristorante) => {
    localStorage.setItem('rh_ristorante', JSON.stringify(r));
    setRistorante(r);
  }, []);

  return (
    <AuthContext.Provider
      value={{ token, ristorante, login, logout, refreshRistorante, isAuthenticated: !!token }}
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
