import { useEffect, useRef, useState, useCallback } from 'react';
import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { ChefHat, CheckCircle, Clock, Flame } from 'lucide-react';
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

/** Filtra gli items escludendo le bevande. Restituisce null se non rimane nulla. */
function filtraItemsCucina(ordine: Ordine): Ordine | null {
  const itemsCucina = ordine.items.filter((i) => !isBevanda(i));
  if (itemsCucina.length === 0) return null;
  return { ...ordine, items: itemsCucina };
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

export default function CucinaPage() {
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
      // Suono più lungo e più acuto
      [0, 0.5].forEach((delay) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'square';
        osc.frequency.value = 1760; // più acuto
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
      // Esclude ordini composti solo da bevande
      const attivi = attiviRaw.map(filtraItemsCucina).filter(Boolean) as Ordine[];

      // Rileva nuovi ordini
      if (knownIds.current.size > 0 && !silent) {
        const nuovi = attivi.filter((o) => !knownIds.current.has(o.id));
        if (nuovi.length > 0) {
          playBeep();
          if (window.navigator.vibrate) window.navigator.vibrate(200);
        }
      }
      attivi.forEach((o) => knownIds.current.add(o.id));

      // Ordina: APERTO prima, poi per ora di creazione (più vecchi prima)
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

  // Prima carica silenziosa (inizializza knownIds senza beep)
  useEffect(() => {
    if (!ristorante) return;
    getOrdini()
      .then((data) => {
        const attiviRaw = (Array.isArray(data) ? data : []).filter(
          (o) => o.stato === 'APERTO' || o.stato === 'IN_PREPARAZIONE'
        );
        const attivi = attiviRaw.map(filtraItemsCucina).filter(Boolean) as Ordine[];
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

  // Polling ogni 8 secondi
  useEffect(() => {
    if (!ristorante) return;
    const interval = setInterval(() => carica(false), POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [ristorante, carica]);

  const avanza = async (ordine: Ordine) => {
    const prossimoStato: StatoOrdine = ordine.stato === 'APERTO' ? 'IN_PREPARAZIONE' : 'SERVITO';
    setUpdatingId(ordine.id);
    try {
      await updateStatoOrdine(ordine.id, prossimoStato);
      setOrdini((prev) =>
        prev
          .map((o) => (o.id === ordine.id ? { ...o, stato: prossimoStato } : o))
          .filter((o) => o.stato === 'APERTO' || o.stato === 'IN_PREPARAZIONE')
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
        <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center">
            <ChefHat className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Cucina</h1>
            <p className="text-sm text-gray-400">{ristorante?.nome}</p>
          </div>
        </div>
        <div className="flex items-center gap-4"></div>
      </div>

      {/* Contatori */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-amber-900/30 border border-amber-700/40 rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Flame className="w-6 h-6 text-white" />
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
          <ChefHat className="w-16 h-16 mb-4" />
          <p className="text-xl font-semibold">Nessun ordine in attesa</p>
          <p className="text-sm mt-1">La cucina è libera</p>
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

                {/* Lista piatti */}
                <div className="bg-black/20 rounded-xl p-3 space-y-2 flex-1">
                  {ordine.items.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <span className="w-7 h-7 bg-gray-700 rounded-lg text-sm font-bold text-white flex items-center justify-center flex-shrink-0">
                        {item.quantita}×
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white leading-tight">{item.nomeMenuItem}</p>
                        {item.note && (
                          <p className="text-xs text-amber-300 mt-0.5 italic">⚠ {item.note}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Note ordine */}
                {ordine.note && (
                  <div className="bg-amber-900/30 border border-amber-700/40 rounded-lg px-3 py-2">
                    <p className="text-xs text-amber-300 font-medium">Note: {ordine.note}</p>
                  </div>
                )}

                {/* Pulsante azione */}
                <button
                  onClick={() => avanza(ordine)}
                  disabled={isUpdating}
                  className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 ${
                    isAperto
                      ? 'bg-amber-500 hover:bg-amber-400 text-amber-950'
                      : 'bg-green-600 hover:bg-green-500 text-white'
                  }`}
                >
                  {isUpdating ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : isAperto ? (
                    <>
                      <Flame className="w-4 h-4" />
                      Inizia preparazione
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Segna come servito
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
