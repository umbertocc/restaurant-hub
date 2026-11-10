import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format, isToday, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { ShoppingCart, Calendar, Clock, TrendingUp, ChefHat, CheckCircle, TableProperties, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { chiudiTavolo, getOrdini } from '../api/ordini';
import { getPrenotazioni } from '../api/prenotazioni';
import { getTavoli } from '../api/tavoli';
import { Ordine, Prenotazione, Tavolo } from '../types';
import { ORDERS_CHANGED_EVENT } from '../realtime/ordersRealtime';
import { getOrdiniOccupantiTavolo } from '../utils/ordini';

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
  const [closingOrderId, setClosingOrderId] = useState<string | null>(null);

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

  const handleCloseTable = async (ordine: Ordine) => {
    setClosingOrderId(ordine.id);
    setTableActionError('');
    try {
      const updated = await chiudiTavolo(ordine.id);
      setOrdini((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
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
                <div
                  key={tavolo.id}
                  aria-label={`Tavolo ${tavolo.numero}, ${statoLabel}, ${tavolo.capacita} posti`}
                  className={`rounded-xl border p-4 ${
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
                  {ordineAttivo?.stato === 'CHIUSO' && (
                    <button
                      type="button"
                      onClick={() => handleCloseTable(ordineAttivo)}
                      disabled={closingOrderId === ordineAttivo.id}
                      className="mt-3 w-full btn-primary flex items-center justify-center gap-2 px-3 py-2 text-sm disabled:opacity-50"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {closingOrderId === ordineAttivo.id ? 'Chiusura...' : 'Chiudi tavolo'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

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
                      {(() => { try { return format(parseISO(o.createdAt), 'HH:mm'); } catch { return '—'; } })()} · {o.items.length} voci
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
