import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getTavoli, createTavolo, updateTavolo, deleteTavolo } from '../api/tavoli';
import { Tavolo } from '../types';

export default function TavoliPage() {
  const { ristorante } = useAuth();
  const [tavoli, setTavoli] = useState<Tavolo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);

  const emptyForm = { numero: '', capacita: '', posizione: '', disponibile: true };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!ristorante) return;
    getTavoli(ristorante.id)
      .then(setTavoli)
      .catch(() => setError('Errore nel caricamento tavoli'))
      .finally(() => setLoading(false));
  }, [ristorante]);

  const set = (field: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    if (!ristorante || !form.numero || !form.capacita) return;
    try {
      if (editingId !== null) {
        const updated = await updateTavolo(editingId, {
          numero: parseInt(form.numero),
          capacita: parseInt(form.capacita),
          posizione: form.posizione || undefined,
          disponibile: form.disponibile,
        });
        setTavoli((prev) => prev.map((t) => (t.id === editingId ? updated : t)));
      } else {
        const created = await createTavolo({
          ristoranteId: ristorante.id,
          numero: parseInt(form.numero),
          capacita: parseInt(form.capacita),
          posizione: form.posizione || undefined,
          disponibile: form.disponibile,
        });
        setTavoli((prev) => [...prev, created]);
      }
      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false);
    } catch {
      setError('Errore nel salvataggio');
    }
  };

  const handleEdit = (t: Tavolo) => {
    setForm({
      numero: String(t.numero),
      capacita: String(t.capacita),
      posizione: t.posizione ?? '',
      disponibile: t.disponibile,
    });
    setEditingId(t.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Eliminare questo tavolo?')) return;
    try {
      await deleteTavolo(id);
      setTavoli((prev) => prev.filter((t) => t.id !== id));
    } catch {
      setError('Errore durante l\'eliminazione');
    }
  };

  const handleCancel = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  if (loading) return <div className="p-6 text-gray-500">Caricamento...</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tavoli</h1>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2 px-4 py-2">
            <Plus className="w-4 h-4" />
            Aggiungi tavolo
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>
      )}

      {showForm && (
        <div className="bg-white rounded-xl shadow border border-gray-100 p-5 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            {editingId ? 'Modifica tavolo' : 'Nuovo tavolo'}
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Numero *</label>
              <input
                type="number"
                className="input"
                value={form.numero}
                onChange={(e) => set('numero', e.target.value)}
                min={1}
              />
            </div>
            <div>
              <label className="label">Capacità *</label>
              <input
                type="number"
                className="input"
                value={form.capacita}
                onChange={(e) => set('capacita', e.target.value)}
                min={1}
              />
            </div>
            <div>
              <label className="label">Posizione</label>
              <input
                className="input"
                placeholder="es. interno, terrazza"
                value={form.posizione}
                onChange={(e) => set('posizione', e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3 mt-5">
              <input
                type="checkbox"
                id="disponibile"
                checked={form.disponibile}
                onChange={(e) => set('disponibile', e.target.checked)}
                className="w-4 h-4 accent-red-600"
              />
              <label htmlFor="disponibile" className="text-sm text-gray-700">Disponibile</label>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={handleSave} className="btn-primary flex items-center gap-2 px-4 py-2">
              <Check className="w-4 h-4" />
              Salva
            </button>
            <button onClick={handleCancel} className="btn-secondary flex items-center gap-2 px-4 py-2">
              <X className="w-4 h-4" />
              Annulla
            </button>
          </div>
        </div>
      )}

      {tavoli.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">Nessun tavolo configurato</p>
          <p className="text-sm mt-1">Aggiungi i tavoli del tuo ristorante</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {tavoli
            .sort((a, b) => a.numero - b.numero)
            .map((t) => (
              <div
                key={t.id}
                className="bg-white rounded-xl shadow border border-gray-100 p-4 flex items-center justify-between"
              >
                <div>
                  <p className="text-lg font-bold text-gray-900">Tavolo {t.numero}</p>
                  <p className="text-sm text-gray-500">{t.capacita} posti{t.posizione ? ` · ${t.posizione}` : ''}</p>
                  <span
                    className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                      t.disponibile ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {t.disponibile ? 'Disponibile' : 'Non disponibile'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(t)}
                    className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(t.id)}
                    className="p-2 rounded-lg text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
