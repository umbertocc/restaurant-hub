import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from 'react';
import { Ristorante, LoginRequest } from '../types';
import { login as apiLogin } from '../api/ristoranti';
import {
  OrdineRealtimeMessage,
  startOrdersRealtime,
  stopOrdersRealtime,
} from '../realtime/ordersRealtime';

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
  trialExpired: boolean;
  trialDaysLeft: number | null;
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
  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastBeepAtRef = useRef(0);

  const setProfilo = useCallback((p: Profilo) => {
    localStorage.setItem('rh_profilo', p);
    setProfiloState(p);
  }, []);

  // I browser bloccano l'audio automatico finche' non c'e' una prima interazione utente.
  useEffect(() => {
    const unlockAudio = () => {
      try {
        if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
        if (audioCtxRef.current.state === 'suspended') {
          audioCtxRef.current.resume();
        }
      } catch {
        // Ignore: in alcuni ambienti l'audio potrebbe non essere disponibile.
      }
    };

    window.addEventListener('pointerdown', unlockAudio, { passive: true });
    window.addEventListener('keydown', unlockAudio);
    return () => {
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
  }, []);

  const playBeep = useCallback(() => {
    const now = Date.now();
    if (now - lastBeepAtRef.current < 800) return;
    lastBeepAtRef.current = now;

    try {
      const ctx = audioCtxRef.current;
      if (!ctx || ctx.state !== 'running') return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.setValueAtTime(1046, ctx.currentTime);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      // Ignore audio errors to avoid breaking notifications.
    }
  }, []);

  const isOnOrdiniRoute = useCallback(() => {
    const path = window.location.pathname.toLowerCase();
    return /(^|\/)ordini(\/|$)/.test(path);
  }, []);

  const handleOrderChanged = useCallback((payload: OrdineRealtimeMessage) => {
    // Suono e banner solo quando arriva un ordine nuovo.
    if (payload.type !== 'CREATED') return;
    if (isOnOrdiniRoute()) return;
    playBeep();
    setNewOrderAlert(true);
    window.setTimeout(() => setNewOrderAlert(false), 5000);
  }, [playBeep, isOnOrdiniRoute]);

  useEffect(() => {
    const ristoranteId = ristorante?.id;
    if (!token || !ristoranteId) {
      stopOrdersRealtime();
      return;
    }

    startOrdersRealtime({
      token,
      ristoranteId,
      onOrderChanged: handleOrderChanged,
    });

    return () => {
      stopOrdersRealtime();
    };
  }, [token, ristorante?.id, handleOrderChanged]);

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

  const trialDaysLeft = useMemo(() => {
    const trialEnd = ristorante?.trialEndAt;
    if (!trialEnd) return null;
    const diffMs = new Date(trialEnd).getTime() - Date.now();
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }, [ristorante?.trialEndAt]);

  const trialExpired = useMemo(() => {
    if (typeof ristorante?.trialExpired === 'boolean') return ristorante.trialExpired;
    if (!ristorante?.trialEndAt) return false;
    return new Date(ristorante.trialEndAt).getTime() <= Date.now();
  }, [ristorante?.trialExpired, ristorante?.trialEndAt]);

  return (
    <AuthContext.Provider
      value={{ token, ristorante, ruoli, login, logout, refreshRistorante, isAuthenticated: !!token, newOrderAlert, dismissOrderAlert, profilo, setProfilo, trialExpired, trialDaysLeft }}
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
