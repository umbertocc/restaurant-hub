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
import { attivaDispositivo } from '../api/dispositivi';
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
  login: (data: LoginRequest, codiceDispositivo?: string) => Promise<void>;
  logout: () => void;
  profiloBloccato: boolean;
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
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  // Profilo imposto dal codice dispositivo: non modificabile dall'utente
  const [profiloDispositivo, setProfiloDispositivo] = useState<Profilo | null>(
    () => localStorage.getItem('rh_device_profilo') as Profilo | null
  );
  const [profiloScelto, setProfiloState] = useState<Profilo>(
    () => (localStorage.getItem('rh_profilo') as Profilo) ?? 'admin'
  );
  const profilo: Profilo = profiloDispositivo ?? profiloScelto;
  const audioCtxRef = useRef<AudioContext | null>(null);
  const logoutRef = useRef<() => void>(() => {});
  const lastBeepAtRef = useRef(0);

  useEffect(() => {
    const updateCurrentTime = () => setCurrentTime(Date.now());
    const intervalId = window.setInterval(updateCurrentTime, 60_000);
    window.addEventListener('focus', updateCurrentTime);
    document.addEventListener('visibilitychange', updateCurrentTime);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', updateCurrentTime);
      document.removeEventListener('visibilitychange', updateCurrentTime);
    };
  }, []);

  const setProfilo = useCallback((p: Profilo) => {
    if (localStorage.getItem('rh_device_profilo')) return;
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
      dispositivoId: Number(localStorage.getItem('rh_device_id')) || null,
      onOrderChanged: handleOrderChanged,
      onForceLogout: () => {
        logoutRef.current();
        window.location.href = `${import.meta.env.BASE_URL}login`;
      },
    });

    return () => {
      stopOrdersRealtime();
    };
  }, [token, ristorante?.id, handleOrderChanged]);

  const login = useCallback(async (data: LoginRequest, codiceDispositivo?: string) => {
    const response = await apiLogin(data);
    let deviceProfilo: Profilo | null = null;
    let deviceId: number | null = null;
    if (codiceDispositivo?.trim()) {
      // Se il codice e' errato o revocato l'errore risale al chiamante e il login non viene completato
      const activation = await attivaDispositivo(codiceDispositivo.trim(), response.token);
      response.token = activation.token;
      deviceProfilo = activation.profilo as Profilo;
      deviceId = activation.dispositivo?.id ?? null;
    }
    if (deviceProfilo) {
      localStorage.setItem('rh_device_profilo', deviceProfilo);
      localStorage.setItem('rh_profilo', deviceProfilo);
      if (deviceId) localStorage.setItem('rh_device_id', String(deviceId));
    } else {
      localStorage.removeItem('rh_device_profilo');
      localStorage.removeItem('rh_device_id');
      localStorage.setItem('rh_profilo', 'admin');
    }
    setProfiloDispositivo(deviceProfilo);
    setProfiloState(deviceProfilo ?? 'admin');
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
    localStorage.removeItem('rh_device_profilo');
    localStorage.removeItem('rh_device_id');
    setProfiloDispositivo(null);
    setToken(null);
    setRistorante(null);
    setRuoli([]);
  }, []);

  useEffect(() => { logoutRef.current = logout; }, [logout]);

  const refreshRistorante = useCallback((r: Ristorante) => {
    localStorage.setItem('rh_ristorante', JSON.stringify(r));
    setRistorante(r);
  }, []);

  const dismissOrderAlert = useCallback(() => setNewOrderAlert(false), []);

  const trialDaysLeft = useMemo(() => {
    if (ristorante?.subscriptionStatus === 'ACTIVE_PAID') return null;
    const trialEnd = ristorante?.trialEndAt;
    if (!trialEnd) return null;
    const diffMs = new Date(trialEnd).getTime() - currentTime;
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }, [currentTime, ristorante?.subscriptionStatus, ristorante?.trialEndAt]);

  const trialExpired = useMemo(() => {
    if (ristorante?.subscriptionStatus === 'ACTIVE_PAID') return false;
    if (ristorante?.subscriptionStatus === 'EXPIRED_TRIAL') return true;
    if (typeof ristorante?.trialExpired === 'boolean') return ristorante.trialExpired;
    if (!ristorante?.trialEndAt) return false;
    return new Date(ristorante.trialEndAt).getTime() <= currentTime;
  }, [currentTime, ristorante?.subscriptionStatus, ristorante?.trialExpired, ristorante?.trialEndAt]);

  return (
    <AuthContext.Provider
      value={{ token, ristorante, ruoli, login, logout, profiloBloccato: !!profiloDispositivo, refreshRistorante, isAuthenticated: !!token, newOrderAlert, dismissOrderAlert, profilo, setProfilo, trialExpired, trialDaysLeft }}
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
