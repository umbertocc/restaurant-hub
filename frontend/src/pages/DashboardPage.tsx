import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format, isToday, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { ShoppingCart, Calendar, Clock, TrendingUp, ChefHat, CheckCircle, TableProperties, Users, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { chiudiTavolo, getOrdini } from '../api/ordini';
import { getPrenotazioni } from '../api/prenotazioni';
import { getTavoli } from '../api/tavoli';
import { Ordine, Prenotazione, Tavolo } from '../types';
import { ORDERS_CHANGED_EVENT } from '../realtime/ordersRealtime';
import { getOrdiniOccupantiTavolo, getOrdiniSedutaTavolo } from '../utils/ordini';

const STATO_ORDINE_STYLE: Record<string, string> = {
  APERTO: 'badge bg-blue-100 text-blue-700',
  IN_PREPARAZIONE: 'badge bg-amber-100 text-amber-700',
  SERVITO: 'badge bg-green-100 text-green-700',
  CHIUSO: 'badge bg-gray-100 text-gray-500',
  PAGATO: 'badge bg-purple-100 text-purple-700',
  ANNULLATO: 'badge bg-red-100 text-red-700',
};

const STATO_ORDINE_LABEL: Record<string, string> = {
  APERTO: 'Aperto',
  IN_PREPARAZIONE: 'In Preparazione',
  SERVITO: 'Servito',
  CHIUSO: 'Chiuso',
};

const STATO_PREN_STYLE: Record<string, string> = {
  IN_ATTESA: 'badge bg-amber-100 text-amber-700',
  CONFERMATA: 'badge bg-green-100 text-green-700',
  ANNULLATA: 'badge bg-red-100 text-red-700',
  COMPLETATA: 'badge bg-gray-100 text-gray-500',
};

function MinutiAttesa({ createdAt }: { createdAt: string }) {
  const [minuti, setMinuti] = useState(0);

  useEffect(() => {
    const calc = () => {
      try {
        setMinuti(Math.max(0, Math.floor((Date.now() - parseISO(createdAt).getTime()) / 60000)));
      } catch { /* ignore */ }
    };
    calc();
    const t = setInterval(calc, 30000);
    return () => clearInterval(t);
  }, [createdAt]);

  const color = minuti >= 20 ? 'text-red-500' : minuti >= 10 ? 'text-amber-500' : 'text-green-500';
  return <span className={`font-bold ${color}`}>{minuti}m</span>;
}

function Spinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function DashboardPage() {
  const { ristorante } = useAuth();
  const [ordini, setOrdini] = useState<Ordine[]>([]);
  const [prenotazioni, setPrenotazioni] = useState<Prenotazione[]>([]);
  const [tavoli, setTavoli] = useState<Tavolo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [tableActionError, setTableActionError] = useState('');
  const [closingOrderId, setClosingOrderId] = useState<number | null>(null);
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);

  const caricaDati = useCallback(() => {
    if (!ristorante) return;
    Promise.all([getOrdini(), getPrenotazioni(), getTavoli()])
      .then(([o, p, t]) => {
        setOrdini(Array.isArray(o) ? o : []);
        setPrenotazioni(Array.isArray(p) ? p : []);
        setTavoli(Array.isArray(t) ? t : []);
        setLoadError('');
      })
      .catch(() => setLoadError('Errore nel caricamento della dashboard'))
      .finally(() => setLoading(false));
  }, [ristorante]);

  useEffect(() => {
    caricaDati();
    window.addEventListener(ORDERS_CHANGED_EVENT, caricaDati);
    return () => window.removeEventListener(ORDERS_CHANGED_EVENT, caricaDati);
  }, [caricaDati]);

  const activeOrders = ordini.filter(
    (o) => o.stato === 'APERTO' || o.stato === 'IN_PREPARAZIONE' || o.stato === 'SERVITO',
  );
  const tavoliOrdinati = [...tavoli].sort((a, b) => a.numero - b.numero);
  const ordiniAttivi = getOrdiniOccupantiTavolo(ordini);
  const tavoliLiberi = tavoliOrdinati.filter(
    (t) => t.disponibile && !ordiniAttivi.some((o) => o.tavoloId === t.id),
  );
  const selectedTable = tavoli.find((t) => t.id === selectedTableId) ?? null;
  const selectedOrders = selectedTable ? getOrdiniSedutaTavolo(ordini, selectedTable.id) : [];
  const sedutaTotale = selectedOrders.reduce((sum, o) => sum + Number(o.totale), 0);

  const handleCloseTable = async (tavoloId: number) => {
    setClosingOrderId(tavoloId);
    setTableActionError('');
    try {
      const updated = await chiudiTavolo(tavoloId);
      setOrdini((prev) => prev.map((o) => updated.find((u) => u.id === o.id) ?? o));
      setSelectedTableId(null);
    } catch {
      setTableActionError('Errore nella chiusura del tavolo. Riprova.');
    } finally {
      setClosingOrderId(null);
    }
  };

  const todayReservations = prenotazioni.filter((p) => {
    try { return isToday(parseISO(p.dataOra)); } catch { return false; }
  });
  const pendingReservations = prenotazioni.filter((p) => p.stato === 'IN_ATTESA');
  const todayRevenue = ordini
    .filter((o) => {
      try { return isToday(parseISO(o.createdAt)) && o.stato !== 'ANNULLATO'; } catch { return false; }
    })
    .reduce((sum, o) => sum + Number(o.totale), 0);

  const stats = [
    { label: 'Ordini attivi', value: activeOrders.length, icon: ShoppingCart, color: 'bg-blue-500', link: '/ordini' },
    { label: 'Prenotazioni oggi', value: todayReservations.length, icon: Calendar, color: 'bg-green-500', link: '/prenotazioni' },
    { label: 'In attesa di conferma', value: pendingReservations.length, icon: Clock, color: 'bg-amber-500', link: '/prenotazioni' },
    { label: 'Incasso oggi', value: `€ ${todayRevenue.toFixed(2)}`, icon: TrendingUp, color: 'bg-red-500', link: '/ordini' },
  ];

  if (loading) return <Spinner />;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center">
          <ChefHat className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Benvenuto, {ristorante?.nome}</h1>
          <p className="text-gray-500 text-sm">
            {format(new Date(), "EEEE d MMMM yyyy", { locale: it })}
          </p>
        </div>
      </div>

      {/* Stats */}
      {loadError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{loadError}</div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Link key={s.label} to={s.link} className="card hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{s.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{s.value}</p>
              </div>
              <div className={`w-12 h-12 ${s.color} rounded-xl flex items-center justify-center`}>
                <s.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      <section className="card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Tavoli in sala</h2>
            <p className="text-sm text-gray-500">Il tavolo resta occupato fino alla chiusura dopo il pagamento</p>
          </div>
          <div className="flex gap-3 text-xs font-medium">
            <span className="flex items-center gap-1.5 text-green-700">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
              {tavoliLiberi.length} liberi
            </span>
            <span className="flex items-center gap-1.5 text-red-700">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              {ordiniAttivi.filter((o) => tavoliOrdinati.some((t) => t.id === o.tavoloId)).length} occupati
            </span>
          </div>
        </div>

        {tableActionError && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            {tableActionError}
          </div>
        )}

        {tavoliOrdinati.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">Nessun tavolo configurato</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {tavoliOrdinati.map((tavolo) => {
              const ordineAttivo = ordiniAttivi.find((o) => o.tavoloId === tavolo.id);
              const libero = tavolo.disponibile && !ordineAttivo;
              const statoLabel = ordineAttivo
                ? `Occupato · ${STATO_ORDINE_LABEL[ordineAttivo.stato]}`
                : tavolo.disponibile
                  ? 'Libero'
                  : 'Non disponibile';
              return (
                <button
                  key={tavolo.id}
                  type="button"
                  onClick={() => {
                    setTableActionError('');
                    setSelectedTableId(tavolo.id);
                  }}
                  aria-label={`Tavolo ${tavolo.numero}, ${statoLabel}, ${tavolo.capacita} posti`}
                  className={`rounded-xl border p-4 text-left transition-shadow hover:shadow-md ${
                    libero
                      ? 'border-green-200 bg-green-50'
                      : ordineAttivo
                        ? 'border-red-200 bg-red-50'
                        : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/80">
                      <TableProperties className={`w-5 h-5 ${libero ? 'text-green-700' : ordineAttivo ? 'text-red-700' : 'text-gray-500'}`} />
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      libero
                        ? 'bg-green-100 text-green-700'
                        : ordineAttivo
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-200 text-gray-600'
                    }`}>
                      {statoLabel}
                    </span>
                  </div>
                  <p className="mt-3 font-semibold text-gray-900">Tavolo {tavolo.numero}</p>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-600">
                    <Users className="w-4 h-4" />
                    {tavolo.capacita} {tavolo.capacita === 1 ? 'posto' : 'posti'}
                  </p>
                  {tavolo.posizione && <p className="mt-1 text-xs text-gray-500">{tavolo.posizione}</p>}
                </button>
              );
            })}
          </div>
        )}
      </section>

      {selectedTable && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelectedTableId(null)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="table-details-title"
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <h2 id="table-details-title" className="text-lg font-semibold text-gray-900">
                  Tavolo {selectedTable.numero}
                </h2>
                <p className="text-sm text-gray-500">
                  {selectedTable.capacita} {selectedTable.capacita === 1 ? 'posto' : 'posti'}
                  {selectedTable.posizione ? ` · ${selectedTable.posizione}` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTableId(null)}
                className="btn-ghost p-1.5"
                aria-label="Chiudi dettagli tavolo"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="space-y-4 p-6">
              {selectedOrders.length > 0 ? (
                <>
                  {selectedOrders.map((ordine, index) => (
                    <div key={ordine.id} className="space-y-3 rounded-lg border border-gray-100 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                          Ordine {index + 1} · {(() => {
                            try { return format(parseISO(ordine.createdAt), 'd MMM, HH:mm', { locale: it }); }
                            catch { return '—'; }
                          })()}
                        </span>
                        <span className={STATO_ORDINE_STYLE[ordine.stato] ?? 'badge bg-gray-100 text-gray-500'}>
                          {STATO_ORDINE_LABEL[ordine.stato] ?? ordine.stato.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="divide-y divide-gray-100">
                        {ordine.items.map((item) => (
                          <div key={item.id} className="flex justify-between gap-4 py-2">
                            <div>
                              <p className="text-sm font-medium text-gray-800">
                                {item.quantita}× {item.nomeMenuItem ?? `Prodotto #${item.menuItemId}`}
                              </p>
                              {item.note && <p className="mt-0.5 text-xs text-gray-500">{item.note}</p>}
                            </div>
                            <span className="whitespace-nowrap text-sm text-gray-700">
                              € {Number(item.subtotale).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {ordine.note && (
                        <p className="text-sm text-gray-600"><span className="font-medium">Note:</span> {ordine.note}</p>
                      )}

                      <div className="space-y-1 border-t pt-2 text-sm">
                        <div className="flex justify-between text-gray-600">
                          <span>{ordine.coperti} coperti</span>
                          <span>€ {(Number(ordine.prezzoCoperto) * ordine.coperti).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-semibold text-gray-900">
                          <span>Subtotale ordine</span>
                          <span>€ {Number(ordine.totale).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="flex justify-between border-t pt-3 text-base font-bold text-gray-900">
                    <span>Totale tavolo</span>
                    <span>€ {sedutaTotale.toFixed(2)}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCloseTable(selectedTable.id)}
                    disabled={closingOrderId === selectedTable.id}
                    className="btn-primary flex w-full items-center justify-center gap-2 px-3 py-2 disabled:opacity-50"
                  >
                    <CheckCircle className="h-4 w-4" />
                    {closingOrderId === selectedTable.id ? 'Chiusura...' : 'Chiudi tavolo'}
                  </button>
                </>
              ) : (
                <p className="py-4 text-center text-sm text-gray-500">
                  {selectedTable.disponibile ? 'Tavolo libero, nessun ordine associato.' : 'Tavolo non disponibile.'}
                </p>
              )}
              {tableActionError && (
                <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {tableActionError}
                </p>
              )}
            </div>
          </section>
        </div>
      )}

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active orders */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Ordini attivi</h2>
            <Link to="/ordini" className="text-sm text-red-600 hover:underline">Vedi tutti</Link>
          </div>
          {activeOrders.length === 0 ? (
            <p className="text-gray-400 text-sm py-6 text-center">Nessun ordine attivo</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {activeOrders.slice(0, 6).map((o) => (
                <div key={o.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-800">Tavolo {o.tavoloId}</p>
                    <p className="text-xs text-gray-400">
                      Ricevuto alle {(() => { try { return format(parseISO(o.createdAt), 'HH:mm'); } catch { return '—'; } })()} · <MinutiAttesa createdAt={o.createdAt} /> fa · {o.items.length} voci
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={STATO_ORDINE_STYLE[o.stato]}>{o.stato.replace('_', ' ')}</span>
                    <span className="text-sm font-semibold text-gray-700">€{Number(o.totale).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Today's reservations */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Prenotazioni di oggi</h2>
            <Link to="/prenotazioni" className="text-sm text-red-600 hover:underline">Vedi tutte</Link>
          </div>
          {todayReservations.length === 0 ? (
            <p className="text-gray-400 text-sm py-6 text-center">Nessuna prenotazione per oggi</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {todayReservations.slice(0, 6).map((p) => (
                <div key={p.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{p.clienteNome}</p>
                    <p className="text-xs text-gray-400">
                      {(() => { try { return format(parseISO(p.dataOra), 'HH:mm'); } catch { return '—'; } })()} · {p.coperti} coperti
                    </p>
                  </div>
                  <span className={STATO_PREN_STYLE[p.stato]}>{p.stato.replace('_', ' ')}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
