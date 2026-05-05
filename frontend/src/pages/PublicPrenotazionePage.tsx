import { useState, FormEvent, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { ChefHat, CheckCircle, CalendarDays } from 'lucide-react';
import { createPrenotazione } from '../api/prenotazioni';
import { getRistorante } from '../api/ristoranti';
import { Ristorante } from '../types';

export default function PublicPrenotazionePage() {
  const { ristoranteId } = useParams<{ ristoranteId: string }>();
  const [ristorante, setRistorante] = useState<Ristorante | null>(null);
  const [loadingRist, setLoadingRist] = useState(true);

  const [form, setForm] = useState({
    clienteNome: '',
    clienteEmail: '',
    clienteTelefono: '',
    dataOra: '',
    coperti: 2,
    note: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!ristoranteId) return;
    // Public endpoint — no auth needed
    getRistorante(parseInt(ristoranteId))
      .then(setRistorante)
      .catch(() => setRistorante(null))
      .finally(() => setLoadingRist(false));
  }, [ristoranteId]);

  const set = (field: string, value: string | number) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!ristoranteId) return;
    setError('');
    setSubmitting(true);
    try {
      // Convert local datetime to ISO-8601 with offset
      const date = new Date(form.dataOra);
      const tzOffset = -date.getTimezoneOffset();
      const sign = tzOffset >= 0 ? '+' : '-';
      const pad = (n: number) => String(Math.abs(n)).padStart(2, '0');
      const isoWithTz = `${date.toISOString().slice(0, 19)}${sign}${pad(Math.floor(Math.abs(tzOffset) / 60))}:${pad(Math.abs(tzOffset) % 60)}`;

      await createPrenotazione({
        ristoranteId: parseInt(ristoranteId),
        clienteNome: form.clienteNome,
        clienteEmail: form.clienteEmail || undefined,
        clienteTelefono: form.clienteTelefono || undefined,
        dataOra: isoWithTz,
        coperti: form.coperti,
        note: form.note || undefined,
      });
      setSuccess(true);
    } catch {
      setError('Errore durante la prenotazione. Riprova o contattaci telefonicamente.');
    } finally {
      setSubmitting(false);
    }
  };

  // Min datetime = now + 1 hour
  const minDateTime = new Date(Date.now() + 60 * 60 * 1000)
    .toISOString()
    .slice(0, 16);

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Prenotazione inviata!</h2>
          <p className="text-gray-500 text-sm mb-4">
            Grazie, <strong>{form.clienteNome}</strong>! La tua richiesta è stata ricevuta.
            Il ristorante ti contatterà per confermarla.
          </p>
          <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600 space-y-1 text-left">
            <p>📅 <strong>Data:</strong> {(() => { try { return format(new Date(form.dataOra), "d MMMM yyyy 'alle' HH:mm", { locale: it }); } catch { return form.dataOra; } })()}</p>
            <p>👥 <strong>Coperti:</strong> {form.coperti}</p>
            {form.note && <p>📝 <strong>Note:</strong> {form.note}</p>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          {ristorante?.logoUrl ? (
            <img
              src={ristorante.logoUrl}
              alt={ristorante.nome}
              className="h-16 object-contain mx-auto mb-3"
            />
          ) : (
            <div className="inline-flex items-center justify-center w-14 h-14 bg-red-600 rounded-2xl mb-3">
              <ChefHat className="w-7 h-7 text-white" />
            </div>
          )}
          {loadingRist ? (
            <div className="h-7 w-48 bg-gray-700 rounded animate-pulse mx-auto" />
          ) : (
            <h1 className="text-2xl font-bold text-white">{ristorante?.nome ?? 'Ristorante'}</h1>
          )}
          {ristorante?.citta && (
            <p className="text-gray-400 text-sm mt-0.5">{ristorante.indirizzo ? `${ristorante.indirizzo}, ${ristorante.citta}` : ristorante.citta}</p>
          )}
          <div className="flex items-center justify-center gap-2 mt-3">
            <CalendarDays className="w-4 h-4 text-red-400" />
            <span className="text-red-300 font-medium text-sm">Prenota un tavolo</span>
          </div>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl shadow-2xl p-7">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Nome e cognome *</label>
              <input
                className="input"
                placeholder="Mario Rossi"
                value={form.clienteNome}
                onChange={(e) => set('clienteNome', e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  className="input"
                  placeholder="mario@email.it"
                  value={form.clienteEmail}
                  onChange={(e) => set('clienteEmail', e.target.value)}
                />
              </div>
              <div>
                <label className="label">Telefono</label>
                <input
                  className="input"
                  placeholder="3401234567"
                  value={form.clienteTelefono}
                  onChange={(e) => set('clienteTelefono', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Data e ora *</label>
                <input
                  type="datetime-local"
                  className="input"
                  min={minDateTime}
                  value={form.dataOra}
                  onChange={(e) => set('dataOra', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="label">Numero persone *</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  className="input"
                  value={form.coperti}
                  onChange={(e) => set('coperti', parseInt(e.target.value) || 1)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">Richieste speciali</label>
              <textarea
                className="input resize-none"
                rows={3}
                placeholder="Allergie, occasioni speciali, preferenze di posto…"
                value={form.note}
                onChange={(e) => set('note', e.target.value)}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full py-3 text-base"
            >
              {submitting ? 'Invio in corso…' : 'Invia prenotazione'}
            </button>
          </form>

          {ristorante?.telefono && (
            <p className="text-center text-sm text-gray-400 mt-4">
              Oppure chiamaci al{' '}
              <a href={`tel:${ristorante.telefono}`} className="text-red-600 font-medium hover:underline">
                {ristorante.telefono}
              </a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
