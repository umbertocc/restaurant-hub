import { useEffect, useState, useCallback } from 'react';
import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { CheckCircle, Clock, Flame, Utensils, Wine, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getOrdini, updateStatoOrdine } from '../api/ordini';
import { CategoriaMenu, Ordine, OrdineItem } from '../types';
import { ORDERS_CHANGED_EVENT } from '../realtime/ordersRealtime';

const CATEGORIE_BEVANDE = new Set<CategoriaMenu>([
  'VINO_ROSSO', 'VINO_BIANCO', 'VINO_ROSE', 'COCKTAIL', 'BIBITA', 'ACQUA',
]);

function isBevanda(item: OrdineItem): boolean {
  return !!item.categoria && CATEGORIE_BEVANDE.has(item.categoria);
}

function safeFormat(iso: string): string {
  try { return format(parseISO(iso), 'HH:mm', { locale: it }); }
  catch { return '—'; }
}

function MinutiAttesa({ createdAt }: { createdAt: string }) {
  const [minuti, setMinuti] = useState(0);
  useEffect(() => {
    const calc = () => {
      try { setMinuti(Math.floor((Date.now() - parseISO(createdAt).getTime()) / 60000)); }
      catch { /* ignore */ }
    };
    calc();
    const t = setInterval(calc, 30000);
    return () => clearInterval(t);
  }, [createdAt]);
  const color = minuti >= 20 ? 'text-red-500' : minuti >= 10 ? 'text-amber-500' : 'text-green-500';
  return <span className={`font-bold ${color}`}>{minuti}m</span>;
}

export default function CamerierePage() {
  const { ristorante } = useAuth();
  const [ordini, setOrdini] = useState<Ordine[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const ordina = (list: Ordine[]) => {
    return [...list].sort((a, b) => {
      // SERVITO prima (pronti da portare), poi IN_PREPARAZIONE, poi APERTO
      const priority = (s: string) => s === 'SERVITO' ? 0 : s === 'IN_PREPARAZIONE' ? 1 : 2;
      const pd = priority(a.stato) - priority(b.stato);
      if (pd !== 0) return pd;
      return a.createdAt.localeCompare(b.createdAt);
    });
  };

  const caricaOrdini = useCallback(async () => {
    if (!ristorante) return;
    try {
      const data = await getOrdini();
      const attivi = (Array.isArray(data) ? data : []).filter(
        (o) => o.stato === 'APERTO' || o.stato === 'IN_PREPARAZIONE' || o.stato === 'SERVITO'
      );
      setOrdini(ordina(attivi));
    } catch {
      // ignore network errors
    } finally {
      setLoading(false);
    }
  }, [ristorante]);

  // Prima carica
  useEffect(() => {
    setLoading(true);
    caricaOrdini();
  }, [caricaOrdini]);

  useEffect(() => {
    const onOrdersChanged = () => {
      caricaOrdini();
    };

    window.addEventListener(ORDERS_CHANGED_EVENT, onOrdersChanged);
    return () => window.removeEventListener(ORDERS_CHANGED_EVENT, onOrdersChanged);
  }, [caricaOrdini]);

  const consegna = async (ordine: Ordine) => {
    setUpdatingId(ordine.id);
    try {
      await updateStatoOrdine(ordine.id, 'CHIUSO');
      setOrdini((prev) => prev.filter((o) => o.id !== ordine.id));
    } catch { /* ignora */ } finally {
      setUpdatingId(null);
    }
  };

  const pronti = ordini.filter((o) => o.stato === 'SERVITO');
  const inCorso = ordini.filter((o) => o.stato === 'IN_PREPARAZIONE' || o.stato === 'APERTO');

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
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
            <Utensils className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Sala</h1>
            <p className="text-sm text-gray-400">{ristorante?.nome}</p>
          </div>
        </div>

      </div>

      {/* Contatori */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-green-900/30 border border-green-700/40 rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Bell className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-3xl font-bold text-green-400">{pronti.length}</p>
            <p className="text-sm text-green-300/70">Pronti da portare</p>
          </div>
        </div>
        <div className="bg-gray-800/50 border border-gray-700/40 rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Clock className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-300">{inCorso.length}</p>
            <p className="text-sm text-gray-400">In preparazione</p>
          </div>
        </div>
      </div>

      {ordini.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-600">
          <Utensils className="w-16 h-16 mb-4" />
          <p className="text-xl font-semibold">Nessun ordine attivo</p>
          <p className="text-sm mt-1">Tutti i tavoli sono a posto</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {ordini.map((ordine) => {
            const isServito = ordine.stato === 'SERVITO';
            const isInPrep = ordine.stato === 'IN_PREPARAZIONE';
            const isUpdating = updatingId === ordine.id;

            const piatti = ordine.items.filter((i) => !isBevanda(i));
            const bevande = ordine.items.filter((i) => isBevanda(i));

            return (
              <div
                key={ordine.id}
                className={`rounded-2xl border-2 p-5 flex flex-col gap-4 transition-all ${
                  isServito
                    ? 'bg-green-950/40 border-green-500 shadow-lg shadow-green-900/30'
                    : isInPrep
                    ? 'bg-blue-950/30 border-blue-700'
                    : 'bg-gray-900/50 border-gray-700'
                }`}
              >
                {/* Intestazione */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {isServito ? (
                        <span className="px-2 py-0.5 bg-green-500 text-green-950 text-xs font-bold rounded-full uppercase animate-pulse">
                          ✓ Pronto
                        </span>
                      ) : isInPrep ? (
                        <span className="px-2 py-0.5 bg-blue-500 text-blue-950 text-xs font-bold rounded-full uppercase">
                          In prep.
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-amber-500 text-amber-950 text-xs font-bold rounded-full uppercase">
                          In attesa
                        </span>
                      )}
                      <span className="text-gray-400 text-xs">#{ordine.id.slice(-6).toUpperCase()}</span>
                    </div>
                    <p className="text-lg font-bold text-white">Tavolo {ordine.tavoloId}</p>
                    <p className="text-sm text-gray-400">
                      {safeFormat(ordine.createdAt)} · <MinutiAttesa createdAt={ordine.createdAt} /> fa
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Totale</p>
                    <p className="text-lg font-bold text-white">€{ordine.totale.toFixed(2)}</p>
                  </div>
                </div>

                {/* Piatti */}
                {piatti.length > 0 && (
                  <div className="bg-black/20 rounded-xl p-3 space-y-2">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Utensils className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Cucina</span>
                      {isServito && <CheckCircle className="w-3.5 h-3.5 text-green-400 ml-auto" />}
                      {isInPrep && <Flame className="w-3.5 h-3.5 text-amber-400 ml-auto" />}
                    </div>
                    {piatti.map((item) => (
                      <div key={item.id} className="flex gap-3">
                        <span className="w-7 h-7 bg-gray-700 rounded-lg text-sm font-bold text-white flex items-center justify-center flex-shrink-0">
                          {item.quantita}×
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white leading-tight">
                            {item.nomeMenuItem ?? `Prodotto #${item.menuItemId}`}
                          </p>
                          {item.note && (
                            <p className="text-xs text-amber-300 mt-0.5 italic">⚠ {item.note}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Bevande */}
                {bevande.length > 0 && (
                  <div className="bg-black/20 rounded-xl p-3 space-y-2">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Wine className="w-3.5 h-3.5 text-purple-400" />
                      <span className="text-xs font-semibold text-purple-400 uppercase tracking-wide">Bar</span>
                    </div>
                    {bevande.map((item) => (
                      <div key={item.id} className="flex gap-3">
                        <span className="w-7 h-7 bg-purple-900/60 rounded-lg text-sm font-bold text-purple-300 flex items-center justify-center flex-shrink-0">
                          {item.quantita}×
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white leading-tight">
                            {item.nomeMenuItem ?? `Prodotto #${item.menuItemId}`}
                          </p>
                          {item.note && (
                            <p className="text-xs text-amber-300 mt-0.5 italic">⚠ {item.note}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Note ordine */}
                {ordine.note && (
                  <div className="bg-amber-900/30 border border-amber-700/40 rounded-lg px-3 py-2">
                    <p className="text-xs text-amber-300 font-medium">Note: {ordine.note}</p>
                  </div>
                )}

                {/* Pulsante consegna — solo se SERVITO */}
                {isServito && (
                  <button
                    onClick={() => consegna(ordine)}
                    disabled={isUpdating}
                    className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white transition-colors disabled:opacity-50"
                  >
                    {isUpdating ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Consegnato al tavolo
                      </>
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
