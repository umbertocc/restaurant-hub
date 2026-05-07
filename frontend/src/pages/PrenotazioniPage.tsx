import { useEffect, useState } from 'react';
import { format, parseISO, isToday, isTomorrow } from 'date-fns';
import { it } from 'date-fns/locale';
import { Calendar, Check, X, Trash2, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  getPrenotazioni,
  updateStatoPrenotazione,
  deletePrenotazione,
} from '../api/prenotazioni';
import { Prenotazione, StatoPrenotazione } from '../types';

const STATO_STYLE: Record<StatoPrenotazione, string> = {
  IN_ATTESA: 'badge bg-amber-100 text-amber-700',
  CONFERMATA: 'badge bg-green-100 text-green-700',
  ANNULLATA: 'badge bg-red-100 text-red-700',
  COMPLETATA: 'badge bg-gray-100 text-gray-500',
};

const STATO_LABEL: Record<StatoPrenotazione, string> = {
  IN_ATTESA: 'In attesa',
  CONFERMATA: 'Confermata',
  ANNULLATA: 'Annullata',
  COMPLETATA: 'Completata',
};

const FILTERS: { label: string; value: StatoPrenotazione | 'ALL' | 'TODAY' }[] = [
  { label: 'Tutte', value: 'ALL' },
  { label: 'Oggi', value: 'TODAY' },
  { label: 'In attesa', value: 'IN_ATTESA' },
  { label: 'Confermate', value: 'CONFERMATA' },
  { label: 'Annullate', value: 'ANNULLATA' },
  { label: 'Completate', value: 'COMPLETATA' },
];

function dateLabel(iso: string): string {
  try {
    const d = parseISO(iso);
    if (isToday(d)) return `Oggi ${format(d, 'HH:mm')}`;
    if (isTomorrow(d)) return `Domani ${format(d, 'HH:mm')}`;
    return format(d, "d MMM yyyy 'alle' HH:mm", { locale: it });
  } catch {
    return '—';
  }
}

function Spinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function PrenotazioniPage() {
  const { ristorante } = useAuth();
  const [prenotazioni, setPrenotazioni] = useState<Prenotazione[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatoPrenotazione | 'ALL' | 'TODAY'>('ALL');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = () => {
    if (!ristorante) return;
    getPrenotazioni()
      .then((data) => {
        const arr = Array.isArray(data) ? data : [];
        setPrenotazioni(arr.sort((a, b) => a.dataOra.localeCompare(b.dataOra)));
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, [ristorante]);

  const filtered = prenotazioni.filter((p) => {
    if (filter === 'TODAY') {
      try { return isToday(parseISO(p.dataOra)); } catch { return false; }
    }
    return filter === 'ALL' || p.stato === filter;
  });

  const handleStato = async (id: string, stato: StatoPrenotazione) => {
    const updated = await updateStatoPrenotazione(id, stato);
    setPrenotazioni((prev) => prev.map((p) => (p.id === id ? updated : p)));
  };

  const handleDelete = async (id: string) => {
    await deletePrenotazione(id);
    setPrenotazioni((prev) => prev.filter((p) => p.id !== id));
    setDeleteId(null);
  };

  if (loading) return <Spinner />;

  return (
    <div className="p-6 space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Prenotazioni</h1>
          <p className="text-sm text-gray-500 mt-0.5">{prenotazioni.length} totali</p>
        </div>
        {ristorante && (
          <a
            href={`${window.location.origin}${import.meta.env.BASE_URL.replace(/\/$/, '')}/prenota/${ristorante.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary gap-2 text-sm"
          >
            <Calendar className="w-4 h-4" />
            Pagina cliente
          </a>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filter === f.value
                ? 'bg-red-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="card flex flex-col items-center py-16 text-gray-400">
          <Calendar className="w-10 h-10 mb-2 opacity-50" />
          <p className="text-sm">Nessuna prenotazione trovata</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((p) => (
            <div key={p.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Main row */}
              <div className="flex items-center gap-4 px-5 py-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="font-semibold text-gray-900">{p.clienteNome}</span>
                    <span className={STATO_STYLE[p.stato]}>{STATO_LABEL[p.stato]}</span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {dateLabel(p.dataOra)} · <strong>{p.coperti}</strong> coperti
                    {p.clienteTelefono && ` · ${p.clienteTelefono}`}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {p.stato === 'IN_ATTESA' && (
                    <>
                      <button
                        onClick={() => handleStato(p.id, 'CONFERMATA')}
                        title="Conferma"
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleStato(p.id, 'ANNULLATA')}
                        title="Annulla"
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  {p.stato === 'CONFERMATA' && (
                    <button
                      onClick={() => handleStato(p.id, 'COMPLETATA')}
                      className="text-xs py-1 px-2.5 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg transition-colors font-medium"
                    >
                      Completa
                    </button>
                  )}
                  {deleteId === p.id ? (
                    <>
                      <button onClick={() => handleDelete(p.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteId(null)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg">
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setDeleteId(p.id)}
                      className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => setExpanded(expanded === p.id ? null : p.id)}
                    className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${expanded === p.id ? 'rotate-180' : ''}`}
                    />
                  </button>
                </div>
              </div>

              {/* Expanded details */}
              {expanded === p.id && (
                <div className="px-5 pb-4 pt-1 border-t border-gray-50 bg-gray-50/50 text-sm text-gray-600 space-y-1">
                  {p.clienteEmail && <p>Email: <span className="font-medium">{p.clienteEmail}</span></p>}
                  {p.clienteTelefono && <p>Telefono: <span className="font-medium">{p.clienteTelefono}</span></p>}
                  {p.tavoloId && <p>Tavolo assegnato: <span className="font-medium">{p.tavoloId}</span></p>}
                  {p.note && <p>Note: <span className="italic">"{p.note}"</span></p>}
                  <p className="text-xs text-gray-400 font-mono">ID: {p.id}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
