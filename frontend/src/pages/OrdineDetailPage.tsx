import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { ArrowLeft } from 'lucide-react';
import { getOrdine, updateStatoOrdine } from '../api/ordini';
import { Ordine, StatoOrdine } from '../types';

const STATO_STYLE: Record<StatoOrdine, string> = {
  APERTO: 'badge bg-blue-100 text-blue-700',
  IN_PREPARAZIONE: 'badge bg-amber-100 text-amber-700',
  SERVITO: 'badge bg-green-100 text-green-700',
  CHIUSO: 'badge bg-gray-100 text-gray-500',
  ANNULLATO: 'badge bg-red-100 text-red-700',
};

const STATO_LABEL: Record<StatoOrdine, string> = {
  APERTO: 'Aperto',
  IN_PREPARAZIONE: 'In Preparazione',
  SERVITO: 'Servito',
  CHIUSO: 'Chiuso',
  ANNULLATO: 'Annullato',
};

const STATI_AVANZAMENTO: Record<StatoOrdine, StatoOrdine | null> = {
  APERTO: 'IN_PREPARAZIONE',
  IN_PREPARAZIONE: 'SERVITO',
  SERVITO: 'CHIUSO',
  CHIUSO: null,
  ANNULLATO: null,
};

function Spinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function OrdineDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ordine, setOrdine] = useState<Ordine | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getOrdine(id)
      .then(setOrdine)
      .finally(() => setLoading(false));
  }, [id]);

  const handleUpdateStato = async (stato: StatoOrdine) => {
    if (!ordine) return;
    const updated = await updateStatoOrdine(ordine.id, stato);
    setOrdine(updated);
  };

  if (loading) return <Spinner />;
  if (!ordine) return (
    <div className="p-6 text-center text-gray-500">
      Ordine non trovato.{' '}
      <Link to="/ordini" className="text-red-600 hover:underline">Torna agli ordini</Link>
    </div>
  );

  const next = STATI_AVANZAMENTO[ordine.stato];

  return (
    <div className="p-6 max-w-2xl space-y-5">
      {/* Back */}
      <button onClick={() => navigate(-1)} className="btn-ghost gap-2 text-sm">
        <ArrowLeft className="w-4 h-4" />
        Torna agli ordini
      </button>

      {/* Header card */}
      <div className="card">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-gray-900 mb-1">Tavolo {ordine.tavoloId}</h1>
            <p className="text-xs text-gray-400 font-mono break-all">ID: {ordine.id}</p>
            <p className="text-sm text-gray-500 mt-1">
              Creato:{' '}
              {(() => {
                try { return format(parseISO(ordine.createdAt), "d MMM yyyy 'alle' HH:mm", { locale: it }); }
                catch { return '—'; }
              })()}
            </p>
            {ordine.chiusoAt && (
              <p className="text-sm text-gray-500">
                Chiuso:{' '}
                {(() => {
                  try { return format(parseISO(ordine.chiusoAt!), "d MMM yyyy 'alle' HH:mm", { locale: it }); }
                  catch { return '—'; }
                })()}
              </p>
            )}
            {ordine.note && (
              <p className="text-sm text-gray-600 mt-1 italic">Note: "{ordine.note}"</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`${STATO_STYLE[ordine.stato]} text-sm`}>
              {STATO_LABEL[ordine.stato]}
            </span>
            <div className="flex gap-2">
              {next && (
                <button
                  onClick={() => handleUpdateStato(next)}
                  className="btn-primary text-sm py-1.5 px-3"
                >
                  → {STATO_LABEL[next]}
                </button>
              )}
              {ordine.stato === 'APERTO' && (
                <button
                  onClick={() => handleUpdateStato('ANNULLATO')}
                  className="text-sm py-1.5 px-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
                >
                  Annulla
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">Voci ordine</h2>
        <div className="divide-y divide-gray-50">
          {ordine.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-gray-800">
                  {item.quantita}× <span className="text-gray-800">{item.nomeMenuItem ?? `Prodotto #${item.menuItemId}`}</span>
                </p>
                {item.note && <p className="text-xs text-gray-400 mt-0.5 italic">"{item.note}"</p>}
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">€ {Number(item.subtotale).toFixed(2)}</p>
                <p className="text-xs text-gray-400">€ {Number(item.prezzoUnitario).toFixed(2)} cad.</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center pt-4 mt-2 border-t border-gray-100">
          <span className="font-semibold text-gray-700">Totale</span>
          <span className="text-xl font-bold text-gray-900">€ {Number(ordine.totale).toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
