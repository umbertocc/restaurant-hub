import { useEffect, useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Globe, Save, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getSitoConfig, updateSitoConfig } from '../api/sito';
import { SitoConfig } from '../types';

const emptyConfig: SitoConfig = {
  slug: '',
  descrizione: '',
  orari: '',
  copertinaUrl: '',
  instagramUrl: '',
  facebookUrl: '',
  sitoPubblicato: false,
};

const slugify = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);

export default function SitoPage() {
  const { ristorante } = useAuth();
  const [form, setForm] = useState<SitoConfig>(emptyConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getSitoConfig()
      .then((c) => setForm({ ...emptyConfig, ...Object.fromEntries(Object.entries(c).map(([k, v]) => [k, v ?? ''])) } as SitoConfig))
      .catch(() => setError('Impossibile caricare la configurazione del sito.'))
      .finally(() => setLoading(false));
  }, []);

  const set = <K extends keyof SitoConfig>(field: K, value: SitoConfig[K]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setSaving(true);
    try {
      const saved = await updateSitoConfig(form);
      setForm({ ...emptyConfig, ...Object.fromEntries(Object.entries(saved).map(([k, v]) => [k, v ?? ''])) } as SitoConfig);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.customMessage ||
          'Errore durante il salvataggio. Riprova.',
      );
    } finally {
      setSaving(false);
    }
  };

  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const slug = (form.slug ?? '').trim().toLowerCase();
  const publicUrl = slug ? `${window.location.origin}${base}/ristoranti/${slug}` : '';

  if (loading) return <div className="p-6 text-gray-500">Caricamento…</div>;

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center">
          <Globe className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="page-title">Sito web</h1>
          <p className="text-sm text-gray-500">
            Pagina pubblica con i dati del tuo ristorante e il menu, sempre aggiornata.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-5">
        <div>
          <label className="label">Indirizzo del sito</label>
          <div className="flex gap-2">
            <input
              className="input"
              value={form.slug ?? ''}
              onChange={(e) => set('slug', e.target.value)}
              placeholder="da-mario"
              maxLength={50}
            />
            <button
              type="button"
              className="btn-secondary text-sm whitespace-nowrap"
              onClick={() => set('slug', slugify(ristorante?.nome ?? ''))}
            >
              Da nome
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Lettere minuscole, numeri e trattini. {publicUrl && <code className="break-all">{publicUrl}</code>}
          </p>
        </div>

        <div>
          <label className="label">Descrizione</label>
          <textarea
            className="input min-h-[120px]"
            value={form.descrizione ?? ''}
            onChange={(e) => set('descrizione', e.target.value)}
            maxLength={2000}
            placeholder="Racconta il tuo ristorante: storia, cucina, atmosfera…"
          />
        </div>

        <div>
          <label className="label">Orari di apertura</label>
          <textarea
            className="input min-h-[90px]"
            value={form.orari ?? ''}
            onChange={(e) => set('orari', e.target.value)}
            maxLength={1000}
            placeholder={'Lun–Ven: 12:00–15:00 / 19:00–23:00\nSab–Dom: 12:00–23:30'}
          />
        </div>

        <div>
          <label className="label">Immagine di copertina (URL)</label>
          <input
            className="input"
            value={form.copertinaUrl ?? ''}
            onChange={(e) => set('copertinaUrl', e.target.value)}
            placeholder="https://..."
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="label">Instagram (URL)</label>
            <input
              className="input"
              value={form.instagramUrl ?? ''}
              onChange={(e) => set('instagramUrl', e.target.value)}
              placeholder="https://instagram.com/..."
            />
          </div>
          <div>
            <label className="label">Facebook (URL)</label>
            <input
              className="input"
              value={form.facebookUrl ?? ''}
              onChange={(e) => set('facebookUrl', e.target.value)}
              placeholder="https://facebook.com/..."
            />
          </div>
        </div>

        <p className="text-xs text-gray-500">
          Nome, indirizzo, telefono e logo vengono presi dal <Link to="/profilo" className="text-red-600 underline">Profilo</Link>;
          il menu è quello che gestisci in <Link to="/menu" className="text-red-600 underline">Menu</Link> (solo piatti disponibili).
        </p>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={form.sitoPubblicato}
            onChange={(e) => set('sitoPubblicato', e.target.checked)}
          />
          Sito pubblicato (visibile a tutti)
        </label>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
            Sito aggiornato con successo!
          </div>
        )}

        <div className="flex justify-end items-center gap-3 pt-2">
          {form.sitoPubblicato && publicUrl && (
            <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary gap-2 text-sm">
              <ExternalLink className="w-4 h-4" />
              Apri sito
            </a>
          )}
          <button type="submit" disabled={saving} className="btn-primary gap-2">
            <Save className="w-4 h-4" />
            {saving ? 'Salvataggio…' : 'Salva'}
          </button>
        </div>
      </form>
    </div>
  );
}
