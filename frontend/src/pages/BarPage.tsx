import { useEffect, useRef, useState, useCallback } from 'react';
import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { GlassWater, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getOrdini, updateStatoOrdine } from '../api/ordini';
import { CategoriaMenu, Ordine, OrdineItem, StatoOrdine } from '../types';

const POLL_INTERVAL = 8000;

const CATEGORIE_BEVANDE = new Set<CategoriaMenu>([
  'VINO_ROSSO', 'VINO_BIANCO', 'VINO_ROSE', 'COCKTAIL', 'BIBITA', 'ACQUA',
]);

function isBevanda(item: OrdineItem): boolean {
  return !!item.categoria && CATEGORIE_BEVANDE.has(item.categoria);
}

/** Filtra gli items lasciando solo le bevande. Restituisce null se non rimane nulla. */
function filtraItemsBar(ordine: Ordine): Ordine | null {
  const itemsBar = ordine.items.filter((i) => isBevanda(i));
  if (itemsBar.length === 0) return null;
  return { ...ordine, items: itemsBar };
}

function safeFormat(iso: string): string {
  try { return format(parseISO(iso), "HH:mm", { locale: it }); }
  catch { return '—'; }
}

function MinutiAttesa({ createdAt }: { createdAt: string }) {
  const [minuti, setMinuti] = useState(0);
  useEffect(() => {
    const calc = () => {
      try {
        const diff = Math.floor((Date.now() - parseISO(createdAt).getTime()) / 60000);
        setMinuti(diff);
      } catch { /* ignore */ }
    };
    calc();
    const t = setInterval(calc, 30000);
    return () => clearInterval(t);
  }, [createdAt]);
  const color = minuti >= 20 ? 'text-red-500' : minuti >= 10 ? 'text-amber-500' : 'text-green-500';
  return <span className={`font-bold ${color}`}>{minuti}m</span>;
}

export default function BarPage() {
  const { ristorante } = useAuth();
  const [ordini, setOrdini] = useState<Ordine[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const knownIds = useRef<Set<string>>(new Set());
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Sblocca AudioContext al primo gesto
  useEffect(() => {
    const unlock = () => {
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
      audioCtxRef.current.resume();
    };
    window.addEventListener('click', unlock, { once: true });
    return () => window.removeEventListener('click', unlock);
  }, []);

  const playBeep = useCallback(() => {
    try {
      const ctx = audioCtxRef.current;
      if (!ctx || ctx.state !== 'running') return;
      [0, 0.5].forEach((delay) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'square';
        osc.frequency.value = 1760;
        gain.gain.setValueAtTime(0.7, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.5);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.5);
      });
    } catch { /* ignorato */ }
  }, []);

  const carica = useCallback(async (silent = false) => {
    if (!ristorante) return;
    try {
      const data = await getOrdini();
      const attiviRaw = (Array.isArray(data) ? data : []).filter(
        (o) => o.stato === 'APERTO' || o.stato === 'IN_PREPARAZIONE'
      );
      // Prende solo ordini con almeno una bevanda
      const attivi = attiviRaw.map(filtraItemsBar).filter(Boolean) as Ordine[];
      if (knownIds.current.size > 0 && !silent) {
        const nuovi = attivi.filter((o) => !knownIds.current.has(o.id));
        if (nuovi.length > 0) {
          playBeep();
          if (window.navigator.vibrate) window.navigator.vibrate(200);
        }
      }
      attivi.forEach((o) => knownIds.current.add(o.id));
      attivi.sort((a, b) => {
        if (a.stato === 'APERTO' && b.stato !== 'APERTO') return -1;
        if (a.stato !== 'APERTO' && b.stato === 'APERTO') return 1;
        return a.createdAt.localeCompare(b.createdAt);
      });
      setOrdini(attivi);
    } catch { /* ignora */ } finally {
      setLoading(false);
    }
  }, [ristorante, playBeep]);

  // Prima carica silenziosa
  useEffect(() => {
    if (!ristorante) return;
    getOrdini()
      .then((data) => {
        const attiviRaw = (Array.isArray(data) ? data : []).filter(
          (o) => o.stato === 'APERTO' || o.stato === 'IN_PREPARAZIONE'
        );
        const attivi = attiviRaw.map(filtraItemsBar).filter(Boolean) as Ordine[];
        attivi.forEach((o) => knownIds.current.add(o.id));
        attivi.sort((a, b) => {
          if (a.stato === 'APERTO' && b.stato !== 'APERTO') return -1;
          if (a.stato !== 'APERTO' && b.stato === 'APERTO') return 1;
          return a.createdAt.localeCompare(b.createdAt);
        });
        setOrdini(attivi);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [ristorante]);

  // Polling
  useEffect(() => {
    if (!ristorante) return;
    const interval = setInterval(() => carica(false), POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [ristorante, carica]);

  const avanza = async (ordine: Ordine) => {
    // Flusso classico: APERTO → IN_PREPARAZIONE → SERVITO → CHIUSO
    let prossimoStato: StatoOrdine;
    if (ordine.stato === 'APERTO') prossimoStato = 'IN_PREPARAZIONE';
    else if (ordine.stato === 'IN_PREPARAZIONE') prossimoStato = 'SERVITO';
    else prossimoStato = 'CHIUSO';
    setUpdatingId(ordine.id);
    try {
      await updateStatoOrdine(ordine.id, prossimoStato);
      setOrdini((prev) =>
        prev
          .map((o) => (o.id === ordine.id ? { ...o, stato: prossimoStato } : o))
          .filter((o) => o.stato === 'APERTO' || o.stato === 'IN_PREPARAZIONE' || o.stato === 'SERVITO')
      );
    } catch { /* ignora */ } finally {
      setUpdatingId(null);
    }
  };

  const aperti = ordini.filter((o) => o.stato === 'APERTO');
  const inPrep = ordini.filter((o) => o.stato === 'IN_PREPARAZIONE');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-screen bg-gray-950">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <GlassWater className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Bar</h1>
            <p className="text-sm text-gray-400">{ristorante?.nome}</p>
          </div>
        </div>
        <div className="flex items-center gap-4"></div>
      </div>

      {/* Contatori */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-amber-900/30 border border-amber-700/40 rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Clock className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-3xl font-bold text-amber-400">{aperti.length}</p>
            <p className="text-sm text-amber-300/70">Nuovi ordini</p>
          </div>
        </div>
        <div className="bg-blue-900/30 border border-blue-700/40 rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Clock className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-3xl font-bold text-blue-400">{inPrep.length}</p>
            <p className="text-sm text-blue-300/70">In preparazione</p>
          </div>
        </div>
      </div>

      {ordini.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-600">
          <GlassWater className="w-16 h-16 mb-4" />
          <p className="text-xl font-semibold">Nessun ordine bevande</p>
          <p className="text-sm mt-1">Il bar è libero</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {ordini.map((ordine) => {
            const isAperto = ordine.stato === 'APERTO';
            const isUpdating = updatingId === ordine.id;
            return (
              <div
                key={ordine.id}
                className={`rounded-2xl border-2 p-5 flex flex-col gap-4 transition-all ${
                  isAperto
                    ? 'bg-amber-950/40 border-amber-500 shadow-lg shadow-amber-900/20'
                    : 'bg-blue-950/40 border-blue-600'
                }`}
              >
                {/* Intestazione ordine */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {isAperto ? (
                        <span className="px-2 py-0.5 bg-amber-500 text-amber-950 text-xs font-bold rounded-full uppercase">
                          Nuovo
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-blue-500 text-blue-950 text-xs font-bold rounded-full uppercase">
                          In prep.
                        </span>
                      )}
                      <span className="text-gray-400 text-xs">#{ordine.id.slice(-6).toUpperCase()}</span>
                    </div>
                    <p className="text-lg font-bold text-white">
                      Tavolo {ordine.tavoloId}
                    </p>
                    <p className="text-sm text-gray-400">
                      Ricevuto alle {safeFormat(ordine.createdAt)} · <MinutiAttesa createdAt={ordine.createdAt} /> fa
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Totale</p>
                    <p className="text-lg font-bold text-white">€{ordine.totale.toFixed(2)}</p>
                  </div>
                </div>
                {/* Lista bevande */}
                <div>
                  <ul className="divide-y divide-gray-800">
                    {ordine.items.map((item, idx) => (
                      <li key={idx} className="py-1 flex items-center justify-between">
                        <span className="font-medium text-white">{item.nomeMenuItem}</span>
                        <span className="text-gray-400">x{item.quantita}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                {/* Azione avanzamento */}
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    className={`btn btn-sm btn-primary ${isUpdating ? 'opacity-50 pointer-events-none' : ''}`}
                    onClick={() => avanza(ordine)}
                    disabled={isUpdating}
                  >
                    {isAperto ? 'In preparazione' : ordine.stato === 'IN_PREPARAZIONE' ? 'Servito' : 'Consegnato'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
