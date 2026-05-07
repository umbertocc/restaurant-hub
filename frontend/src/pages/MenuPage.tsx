import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Search, X, Check, Package } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getMenu, createMenuItem, updateMenuItem, deleteMenuItem } from '../api/menu';
import { MenuItem, CategoriaMenu } from '../types';

const CATEGORIE: CategoriaMenu[] = [
  'ANTIPASTO', 'PRIMO', 'SECONDO', 'CONTORNO', 'DESSERT',
  'VINO_ROSSO', 'VINO_BIANCO', 'VINO_ROSE', 'COCKTAIL', 'BIBITA', 'ACQUA', 'PIZZA',
];

const CATEGORIA_LABEL: Record<CategoriaMenu, string> = {
  ANTIPASTO: 'Antipasto', PRIMO: 'Primo', SECONDO: 'Secondo',
  CONTORNO: 'Contorno', DESSERT: 'Dessert',
  VINO_ROSSO: 'Vino Rosso', VINO_BIANCO: 'Vino Bianco', VINO_ROSE: 'Vino Rosé',
  COCKTAIL: 'Cocktail', BIBITA: 'Bibita', ACQUA: 'Acqua',
  PIZZA: 'Pizza',
};

type ModalMode = 'add' | 'edit' | null;

const emptyItem = (ristoranteId: number): Omit<MenuItem, 'id'> => ({
  ristoranteId,
  nome: '',
  descrizione: '',
  categoria: 'PRIMO',
  prezzo: 0,
  disponibile: true,
  immagineUrl: '',
  allergeni: '',
});

function Spinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function MenuPage() {
  const { ristorante } = useAuth();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<CategoriaMenu | 'ALL'>('ALL');
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editItem, setEditItem] = useState<Partial<MenuItem>>(emptyItem(ristorante?.id ?? 0));
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const load = () => {
    if (!ristorante) return;
    setLoading(true);
    getMenu(ristorante.id)
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  };

  useEffect(load, [ristorante]);

  const filtered = items.filter((item) => {
    const q = search.toLowerCase();
    const matchSearch =
      item.nome.toLowerCase().includes(q) ||
      (item.descrizione ?? '').toLowerCase().includes(q);
    const matchCat = filterCat === 'ALL' || item.categoria === filterCat;
    return matchSearch && matchCat;
  });

  const openAdd = () => {
    setEditItem(emptyItem(ristorante!.id));
    setModalMode('add');
  };

  const openEdit = (item: MenuItem) => {
    setEditItem({ ...item });
    setModalMode('edit');
  };

  const closeModal = () => {
    setModalMode(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (modalMode === 'add') {
        const created = await createMenuItem(editItem as Omit<MenuItem, 'id'>);
        setItems((prev) => [...prev, created]);
      } else if (modalMode === 'edit' && editItem.id !== undefined) {
        const { id, ...data } = editItem as MenuItem;
        const updated = await updateMenuItem(id, data);
        setItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
      }
      closeModal();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    await deleteMenuItem(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
    setDeleteId(null);
  };

  const handleToggle = async (item: MenuItem) => {
    const updated = await updateMenuItem(item.id, { disponibile: !item.disponibile });
    setItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
  };

  const set = (field: string, value: unknown) =>
    setEditItem((prev) => ({ ...prev, [field]: value }));

  if (loading) return <Spinner />;

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Menu</h1>
          <p className="text-sm text-gray-500 mt-0.5">{items.length} voci totali</p>
        </div>
        <button onClick={openAdd} className="btn-primary gap-2">
          <Plus className="w-4 h-4" />
          Aggiungi piatto
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cerca piatto…"
            className="input pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['ALL', ...CATEGORIE] as const).map((c) => (
            <button
              key={c}
              onClick={() => setFilterCat(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filterCat === c
                  ? 'bg-red-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {c === 'ALL' ? 'Tutti' : CATEGORIA_LABEL[c]}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Package className="w-10 h-10 mb-2 opacity-50" />
            <p className="text-sm">Nessun piatto trovato</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Nome', 'Categoria', 'Prezzo', 'Allergeni', 'Disponibile', ''].map((h) => (
                    <th
                      key={h}
                      className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {item.immagineUrl && (
                          <img
                            src={item.immagineUrl}
                            alt={item.nome}
                            className="w-10 h-10 rounded-lg object-cover shrink-0"
                          />
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{item.nome}</p>
                          {item.descrizione && (
                            <p className="text-xs text-gray-400 mt-0.5 max-w-xs truncate">{item.descrizione}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="badge bg-gray-100 text-gray-600">
                        {CATEGORIA_LABEL[item.categoria]}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-semibold whitespace-nowrap">
                      € {Number(item.prezzo).toFixed(2)}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 max-w-[160px] truncate">
                      {item.allergeni || '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => handleToggle(item)}
                        className={`relative w-10 h-6 rounded-full transition-colors ${
                          item.disponibile ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${
                            item.disponibile ? 'left-5' : 'left-1'
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(item)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        {deleteId === item.id ? (
                          <>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteId(null)}
                              className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setDeleteId(item.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {modalMode && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">
                {modalMode === 'add' ? 'Aggiungi piatto' : 'Modifica piatto'}
              </h2>
              <button onClick={closeModal} className="btn-ghost p-1.5">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label">Nome *</label>
                  <input
                    className="input"
                    value={editItem.nome ?? ''}
                    onChange={(e) => set('nome', e.target.value)}
                    placeholder="Es. Spaghetti alla carbonara"
                  />
                </div>
                <div>
                  <label className="label">Categoria *</label>
                  <select
                    className="input"
                    value={editItem.categoria ?? 'PRIMO'}
                    onChange={(e) => set('categoria', e.target.value)}
                  >
                    {CATEGORIE.map((c) => (
                      <option key={c} value={c}>{CATEGORIA_LABEL[c]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Prezzo (€) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.50"
                    className="input"
                    value={editItem.prezzo ?? 0}
                    onChange={(e) => set('prezzo', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="col-span-2">
                  <label className="label">Descrizione</label>
                  <textarea
                    className="input resize-none"
                    rows={3}
                    value={editItem.descrizione ?? ''}
                    onChange={(e) => set('descrizione', e.target.value)}
                    placeholder="Breve descrizione del piatto…"
                  />
                </div>
                <div className="col-span-2">
                  <label className="label">Allergeni</label>
                  <input
                    className="input"
                    value={editItem.allergeni ?? ''}
                    onChange={(e) => set('allergeni', e.target.value)}
                    placeholder="Es. glutine, lattosio, uova"
                  />
                </div>
                <div className="col-span-2">
                  <label className="label">URL immagine</label>
                  <input
                    className="input"
                    value={editItem.immagineUrl ?? ''}
                    onChange={(e) => set('immagineUrl', e.target.value)}
                    placeholder="https://..."
                  />
                </div>
                <div className="col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editItem.disponibile ?? true}
                      onChange={(e) => set('disponibile', e.target.checked)}
                      className="w-4 h-4 rounded text-red-600"
                    />
                    <span className="text-sm font-medium text-gray-700">Disponibile</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t">
              <button onClick={closeModal} className="btn-secondary">Annulla</button>
              <button
                onClick={handleSave}
                disabled={saving || !editItem.nome}
                className="btn-primary"
              >
                {saving ? 'Salvataggio…' : 'Salva'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
