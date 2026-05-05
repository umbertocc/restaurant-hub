import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from 'react';
import { Ristorante, LoginRequest } from '../types';
import { login as apiLogin } from '../api/ristoranti';
import { getOrdini } from '../api/ordini';

interface AuthContextValue {
  token: string | null;
  ristorante: Ristorante | null;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => void;
  refreshRistorante: (r: Ristorante) => void;
  isAuthenticated: boolean;
  newOrderAlert: boolean;
  dismissOrderAlert: () => void;
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
  const [newOrderAlert, setNewOrderAlert] = useState(false);
  const knownIds = useRef<Set<string>>(new Set());
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Sblocca AudioContext al primo gesto utente (autoplay policy)
  useEffect(() => {
    const unlock = () => {
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
      audioCtxRef.current.resume();
    };
    window.addEventListener('click', unlock);
    window.addEventListener('keydown', unlock);
    return () => {
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  const playBeep = () => {
    try {
      const ctx = audioCtxRef.current;
      if (!ctx || ctx.state !== 'running') return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } catch { /* ignorato */ }
  };

  // Polling globale: controlla nuovi ordini ogni 8 secondi quando loggato
  useEffect(() => {
    if (!ristorante) return;
    const poll = () => {
      if (document.visibilityState !== 'visible') return;
      getOrdini(ristorante.id)
        .then((data) => {
          const arr = Array.isArray(data) ? data : [];
          if (knownIds.current.size > 0) {
            const nuovi = arr.filter((o) => !knownIds.current.has(o.id));
            if (nuovi.length > 0) {
              playBeep();
              setNewOrderAlert(true);
              setTimeout(() => setNewOrderAlert(false), 5000);
            }
          }
          arr.forEach((o) => knownIds.current.add(o.id));
        })
        .catch(() => { /* ignora errori di rete */ });
    };
    // Prima chiamata: inizializza gli ID senza notificare
    getOrdini(ristorante.id)
      .then((data) => { (Array.isArray(data) ? data : []).forEach((o) => knownIds.current.add(o.id)); })
      .catch(() => {});
    const interval = setInterval(poll, 8000);
    return () => {
      clearInterval(interval);
      knownIds.current.clear();
    };
  }, [ristorante]);

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

  const dismissOrderAlert = useCallback(() => setNewOrderAlert(false), []);

  return (
    <AuthContext.Provider
      value={{ token, ristorante, login, logout, refreshRistorante, isAuthenticated: !!token, newOrderAlert, dismissOrderAlert }}
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
