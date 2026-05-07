import { useEffect, useState } from 'react';
import { Plus, Trash2, X, Check, Wine, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getMenu } from '../api/menu';
import {
  getAbbinamenti,
  createAbbinamento,
  deleteAbbinamento,
} from '../api/abbinamenti';
import { MenuItem, Abbinamento, TipoAbbinamento, CategoriaMenu } from '../types';

const TIPO_LABEL: Record<TipoAbbinamento, string> = {
  VINO: 'Vino',
  COCKTAIL: 'Cocktail',
  BIBITA: 'Bibita',
  DESSERT: 'Dessert',
};

const TIPO_STYLE: Record<TipoAbbinamento, string> = {
  VINO: 'badge bg-purple-100 text-purple-700',
  COCKTAIL: 'badge bg-orange-100 text-orange-700',
  BIBITA: 'badge bg-blue-100 text-blue-700',
  DESSERT: 'badge bg-pink-100 text-pink-700',
};

const FOOD_CATS: CategoriaMenu[] = ['ANTIPASTO', 'PRIMO', 'SECONDO', 'CONTORNO', 'DESSERT'];
const DRINK_CATS: CategoriaMenu[] = [
  'VINO_ROSSO', 'VINO_BIANCO', 'VINO_ROSE', 'COCKTAIL', 'BIBITA', 'ACQUA',
];

function Spinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function AbbinamentiPage() {
  const { ristorante } = useAuth();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPiatto, setSelectedPiatto] = useState<MenuItem | null>(null);
  const [abbinamenti, setAbbinamenti] = useState<Abbinamento[]>([]);
  const [loadingAbb, setLoadingAbb] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Form state
  const [formAbbId, setFormAbbId] = useState('');
  const [formTipo, setFormTipo] = useState<TipoAbbinamento>('VINO');
  const [formScore, setFormScore] = useState(80);
  const [formDesc, setFormDesc] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!ristorante) return;
    getMenu(ristorante.id)
      .then(setMenuItems)
      .finally(() => setLoading(false));
  }, [ristorante]);

  const selectPiatto = async (item: MenuItem) => {
    setSelectedPiatto(item);
    setLoadingAbb(true);
    try {
      const data = await getAbbinamenti(item.id);
      setAbbinamenti(data);
    } finally {
      setLoadingAbb(false);
    }
  };

  const handleCreate = async () => {
    if (!selectedPiatto || !formAbbId) return;
    setSaving(true);
    try {
      const created = await createAbbinamento({
        piattoId: selectedPiatto.id,
        abbinamentoItemId: parseInt(formAbbId),
        tipo: formTipo,
        score: formScore,
        descrizione: formDesc || undefined,
      });
      setAbbinamenti((prev) => [...prev, created]);
      setShowModal(false);
      setFormAbbId('');
      setFormScore(80);
      setFormDesc('');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    await deleteAbbinamento(id);
    setAbbinamenti((prev) => prev.filter((a) => a.id !== id));
    setDeleteId(null);
  };

  const foodItems = menuItems.filter((m) => FOOD_CATS.includes(m.categoria));
  const drinkItems = menuItems.filter((m) => DRINK_CATS.includes(m.categoria));

  const getItemName = (id: number) =>
    menuItems.find((m) => m.id === id)?.nome ?? `ID ${id}`;

  if (loading) return <Spinner />;

  return (
    <div className="p-6 space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Abbinamenti</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestisci i suggerimenti vino/bevanda per ogni piatto</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: piatto selector */}
        <div className="card lg:col-span-1">
          <h2 className="font-semibold text-gray-900 mb-3">Seleziona piatto</h2>
          <div className="space-y-1 max-h-[60vh] overflow-y-auto pr-1">
            {foodItems.map((item) => (
              <button
                key={item.id}
                onClick={() => selectPiatto(item)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  selectedPiatto?.id === item.id
                    ? 'bg-red-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <p className="font-medium">{item.nomeMenuItem ?? `Prodotto #${item.menuItemId}`}</p>
                <p className={`text-xs ${selectedPiatto?.id === item.id ? 'text-red-200' : 'text-gray-400'}`}>
                  {item.categoria}
                </p>
              </button>
            ))}
            {foodItems.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">
                Nessun piatto nel menu. Aggiungili dalla sezione Menu.
              </p>
            )}
          </div>
        </div>

        {/* Right: abbinamenti for selected piatto */}
        <div className="lg:col-span-2">
          {!selectedPiatto ? (
            <div className="card flex flex-col items-center justify-center py-16 text-gray-400">
              <Wine className="w-10 h-10 mb-2 opacity-40" />
              <p className="text-sm">Seleziona un piatto per vedere gli abbinamenti</p>
            </div>
          ) : (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-semibold text-gray-900">{selectedPiatto.nome}</h2>
                  <p className="text-sm text-gray-500">{abbinamenti.length} abbinamenti</p>
                </div>
                <button onClick={() => setShowModal(true)} className="btn-primary gap-2 text-sm">
                  <Plus className="w-4 h-4" />
                  Aggiungi
                </button>
              </div>

              {loadingAbb ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : abbinamenti.length === 0 ? (
                <p className="text-sm text-gray-400 py-8 text-center">
                  Nessun abbinamento. Clicca "Aggiungi" per crearne uno.
                </p>
              ) : (
                <div className="space-y-2">
                  {abbinamenti.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-gray-100 text-lg font-bold text-gray-700">
                          {a.score}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{getItemName(a.abbinamentoItemId)}</p>
                          {a.descrizione && <p className="text-xs text-gray-400 italic">"{a.descrizione}"</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={TIPO_STYLE[a.tipo]}>{TIPO_LABEL[a.tipo]}</span>
                        {deleteId === a.id ? (
                          <>
                            <button onClick={() => handleDelete(a.id)} className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg">
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setDeleteId(null)} className="p-1.5 text-gray-400 hover:bg-gray-200 rounded-lg">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setDeleteId(a.id)}
                            className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add abbinamento modal */}
      {showModal && selectedPiatto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">Nuovo abbinamento</h2>
              <button onClick={() => setShowModal(false)} className="btn-ghost p-1.5">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-500">
                Piatto: <strong className="text-gray-800">{selectedPiatto.nome}</strong>
              </p>

              <div>
                <label className="label">Bevanda / Abbinamento *</label>
                <select
                  className="input"
                  value={formAbbId}
                  onChange={(e) => setFormAbbId(e.target.value)}
                >
                  <option value="">Seleziona…</option>
                  {drinkItems.map((m) => (
                    <option key={m.id} value={m.id}>{m.nome} — {m.categoria}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Tipo</label>
                  <select
                    className="input"
                    value={formTipo}
                    onChange={(e) => setFormTipo(e.target.value as TipoAbbinamento)}
                  >
                    {(Object.keys(TIPO_LABEL) as TipoAbbinamento[]).map((t) => (
                      <option key={t} value={t}>{TIPO_LABEL[t]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Score (1–100)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    className="input"
                    value={formScore}
                    onChange={(e) => setFormScore(parseInt(e.target.value) || 80)}
                  />
                </div>
              </div>

              <div>
                <label className="label">Descrizione</label>
                <input
                  className="input"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Es. Ottimo con i sapori decisi della carbonara…"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t">
              <button onClick={() => setShowModal(false)} className="btn-secondary">Annulla</button>
              <button onClick={handleCreate} disabled={saving || !formAbbId} className="btn-primary">
                {saving ? 'Salvataggio…' : 'Aggiungi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* suppress unused import warning */}
      <div className="hidden"><ChevronDown /></div>
    </div>
  );
}
