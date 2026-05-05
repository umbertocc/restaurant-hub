import { useState, useEffect, FormEvent } from 'react';
import { Save, Store, Download, QrCode } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { useAuth } from '../context/AuthContext';
import { updateRistorante } from '../api/ristoranti';
import { Ristorante } from '../types';

export default function ProfiloPage() {
  const { ristorante, refreshRistorante } = useAuth();
  const [form, setForm] = useState<Partial<Ristorante>>({});
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (ristorante) {
      setForm({ ...ristorante });
    }
  }, [ristorante]);

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!ristorante) return;
    setError('');
    setSuccess(false);
    setSaving(true);
    try {
      const updated = await updateRistorante(ristorante.id, form);
      refreshRistorante(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError('Errore durante il salvataggio. Riprova.');
    } finally {
      setSaving(false);
    }
  };

  if (!ristorante) return null;

  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const prenotazioneUrl = `${window.location.origin}${base}/prenota/${ristorante.id}`;

  const downloadQR = () => {
    const canvas = document.getElementById('qr-canvas') as HTMLCanvasElement;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `qr-prenotazione-${ristorante.nome}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center">
          <Store className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="page-title">Profilo ristorante</h1>
          <p className="text-sm text-gray-500">Piano: <strong>{ristorante.piano}</strong></p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="sm:col-span-2">
            <label className="label">Nome ristorante *</label>
            <input
              className="input"
              value={form.nome ?? ''}
              onChange={(e) => set('nome', e.target.value)}
              required
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Email *</label>
            <input
              type="email"
              className="input"
              value={form.email ?? ''}
              onChange={(e) => set('email', e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Telefono</label>
            <input
              className="input"
              value={form.telefono ?? ''}
              onChange={(e) => set('telefono', e.target.value)}
              placeholder="0612345678"
            />
          </div>
          <div>
            <label className="label">Città</label>
            <input
              className="input"
              value={form.citta ?? ''}
              onChange={(e) => set('citta', e.target.value)}
              placeholder="Roma"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Indirizzo</label>
            <input
              className="input"
              value={form.indirizzo ?? ''}
              onChange={(e) => set('indirizzo', e.target.value)}
              placeholder="Via Roma 1"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">URL Logo</label>
            <input
              className="input"
              value={form.logoUrl ?? ''}
              onChange={(e) => set('logoUrl', e.target.value)}
              placeholder="https://..."
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
            Profilo aggiornato con successo!
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button type="submit" disabled={saving} className="btn-primary gap-2">
            <Save className="w-4 h-4" />
            {saving ? 'Salvataggio…' : 'Salva modifiche'}
          </button>
        </div>
      </form>

      {/* Link for customers */}
      <div className="card bg-gray-50 border border-dashed border-gray-300">
        <h3 className="font-semibold text-gray-700 mb-2">Link prenotazione clienti</h3>
        <p className="text-sm text-gray-500 mb-3">
          Condividi questo link con i tuoi clienti per permettere loro di prenotare:
        </p>
        <div className="flex items-center gap-2">
          <code className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 truncate">
            {prenotazioneUrl}
          </code>
          <button
            onClick={() => navigator.clipboard.writeText(prenotazioneUrl)}
            className="btn-secondary text-sm whitespace-nowrap"
          >
            Copia
          </button>
        </div>
      </div>

      {/* QR Code */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <QrCode className="w-5 h-5 text-red-600" />
          <h3 className="font-semibold text-gray-800">QR Code prenotazione</h3>
        </div>
        <p className="text-sm text-gray-500 mb-5">
          Stampa questo QR Code e posizionalo sui tavoli o all'ingresso. I clienti lo scansionano per prenotare direttamente.
        </p>
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
            <QRCodeCanvas
              id="qr-canvas"
              value={prenotazioneUrl}
              size={200}
              level="H"
              includeMargin
              imageSettings={{
                src: '',
                height: 0,
                width: 0,
                excavate: false,
              }}
            />
          </div>
          <button onClick={downloadQR} className="btn-primary flex items-center gap-2 px-5 py-2">
            <Download className="w-4 h-4" />
            Scarica QR Code
          </button>
        </div>
      </div>
    </div>
  );
}
