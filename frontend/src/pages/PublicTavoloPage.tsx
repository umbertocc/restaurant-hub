import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ChefHat, Plus, Minus, ShoppingCart, CheckCircle, Wine, X } from 'lucide-react';
import { getRistorante } from '../api/ristoranti';
import { getMenu } from '../api/menu';
import { createOrdine } from '../api/ordini';
import { getSuggerimenti } from '../api/abbinamenti';
import { Ristorante, MenuItem, CategoriaMenu } from '../types';

const FOOD_CATS: CategoriaMenu[] = ['ANTIPASTO', 'PRIMO', 'SECONDO', 'CONTORNO', 'DESSERT'];

interface CartItem {
  item: MenuItem;
  quantita: number;
}

const CATEGORIA_LABELS: Record<CategoriaMenu, string> = {
  ANTIPASTO: 'Antipasti',
  PRIMO: 'Primi',
  SECONDO: 'Secondi',
  CONTORNO: 'Contorni',
  DESSERT: 'Dessert',
  VINO_ROSSO: 'Vini Rossi',
  VINO_BIANCO: 'Vini Bianchi',
  VINO_ROSE: 'Vini Rosé',
  COCKTAIL: 'Cocktail',
  BIBITA: 'Bibite',
  ACQUA: 'Acqua',
};

export default function PublicTavoloPage() {
  const { ristoranteId, tavoloId } = useParams<{ ristoranteId: string; tavoloId: string }>();
  const [ristorante, setRistorante] = useState<Ristorante | null>(null);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<Record<number, CartItem>>({});
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [abbModal, setAbbModal] = useState<{ item: MenuItem; suggerimenti: MenuItem[] } | null>(null);
  const [loadingAbb, setLoadingAbb] = useState(false);

  useEffect(() => {
    if (!ristoranteId) return;
    Promise.all([
      getRistorante(parseInt(ristoranteId)),
      getMenu(parseInt(ristoranteId)),
    ])
      .then(([r, m]) => { setRistorante(r); setMenu(m); })
      .catch(() => setError('Errore nel caricamento del menu'))
      .finally(() => setLoading(false));
  }, [ristoranteId]);

  const addToCart = (item: MenuItem) => {
    setCart((prev) => ({
      ...prev,
      [item.id]: { item, quantita: (prev[item.id]?.quantita ?? 0) + 1 },
    }));
  };

  const removeFromCart = (itemId: number) => {
    setCart((prev) => {
      const existing = prev[itemId];
      if (!existing || existing.quantita <= 1) {
        const next = { ...prev };
        delete next[itemId];
        return next;
      }
      return { ...prev, [itemId]: { ...existing, quantita: existing.quantita - 1 } };
    });
  };

  const openAbbModal = async (item: MenuItem) => {
    setAbbModal({ item, suggerimenti: [] });
    setLoadingAbb(true);
    try {
      const suggerimenti = await getSuggerimenti(item.id);
      setAbbModal({ item, suggerimenti });
    } finally {
      setLoadingAbb(false);
    }
  };

  const cartItems = Object.values(cart);
  const totale = cartItems.reduce((sum, ci) => sum + ci.item.prezzo * ci.quantita, 0);
  const totalePezzi = cartItems.reduce((sum, ci) => sum + ci.quantita, 0);

  const handleOrdina = async () => {
    if (!ristoranteId || !tavoloId || cartItems.length === 0) return;
    setSubmitting(true);
    setError('');
    try {
      await createOrdine({
        ristoranteId: parseInt(ristoranteId),
        tavoloId: parseInt(tavoloId),
        items: cartItems.map((ci) => ({ menuItemId: ci.item.id, quantita: ci.quantita })),
        note: note || undefined,
      });
      setSuccess(true);
    } catch {
      setError("Errore nell'invio dell'ordine. Riprova.");
    } finally {
      setSubmitting(false);
    }
  };

  const grouped = menu.reduce((acc, item) => {
    if (!acc[item.categoria]) acc[item.categoria] = [];
    acc[item.categoria].push(item);
    return acc;
  }, {} as Record<CategoriaMenu, MenuItem[]>);

  const categorie = Object.keys(grouped) as CategoriaMenu[];

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-gray-500">Caricamento menu...</p>
    </div>
  );

  if (success) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Ordine inviato!</h2>
        <p className="text-gray-600">Il tuo ordine è stato ricevuto e verrà preparato a breve.</p>
        <button
          onClick={() => { setSuccess(false); setCart({}); setNote(''); }}
          className="mt-6 w-full bg-red-600 text-white py-3 rounded-xl font-semibold hover:bg-red-700"
        >
          Nuovo ordine
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-44">
      {/* Header */}
      <div className="bg-red-600 text-white p-6 text-center">
        <ChefHat className="w-10 h-10 mx-auto mb-2" />
        <h1 className="text-2xl font-bold">{ristorante?.nome ?? 'Ristorante'}</h1>
        <p className="text-red-100 text-sm mt-1">Tavolo {tavoloId} · Ordina dal menu</p>
      </div>

      {/* Menu */}
      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>
        )}

        {categorie.length === 0 && !error && (
          <div className="text-center py-12 text-gray-400">
            <p>Nessun prodotto disponibile</p>
          </div>
        )}

        {categorie.map((cat) => (
          <div key={cat}>
            <h2 className="text-lg font-bold text-gray-800 mb-3 pb-1 border-b border-gray-200">
              {CATEGORIA_LABELS[cat] ?? cat}
            </h2>
            <div className="space-y-3">
              {grouped[cat].map((item) => {
                const inCart = cart[item.id]?.quantita ?? 0;
                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                  >
                    {item.immagineUrl && (
                      <img
                        src={item.immagineUrl}
                        alt={item.nome}
                        className="w-full h-40 object-cover"
                      />
                    )}
                    <div className="p-4 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900">{item.nome}</p>
                      {item.descrizione && (
                        <p className="text-sm text-gray-500 mt-0.5">{item.descrizione}</p>
                      )}
                      {item.allergeni && (
                        <p className="text-xs text-amber-600 mt-0.5">⚠ {item.allergeni}</p>
                      )}
                      <p className="text-red-600 font-bold mt-1">€{item.prezzo.toFixed(2)}</p>
                      {FOOD_CATS.includes(item.categoria) && (
                        <button
                          onClick={() => openAbbModal(item)}
                          className="mt-1.5 flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 font-medium"
                        >
                          <Wine className="w-3 h-3" />
                          Abbinamenti consigliati
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {inCart > 0 ? (
                        <>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-6 text-center font-bold text-gray-900">{inCart}</span>
                          <button
                            onClick={() => addToCart(item)}
                            className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => addToCart(item)}
                          className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Abbinamenti bottom sheet */}
      {abbModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50" onClick={() => setAbbModal(null)}>
          <div
            className="bg-white rounded-t-2xl w-full max-w-2xl p-6 max-h-[70vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Wine className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-gray-900">Abbinamenti per {abbModal.item.nome}</h3>
              </div>
              <button onClick={() => setAbbModal(null)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            {loadingAbb ? (
              <div className="flex justify-center py-6">
                <div className="w-6 h-6 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : abbModal.suggerimenti.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Nessun abbinamento disponibile per questo piatto.</p>
            ) : (
              <div className="space-y-3">
                {abbModal.suggerimenti.map((s) => (
                  <div key={s.id} className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800">{s.nome}</p>
                      {s.descrizione && <p className="text-xs text-gray-500 truncate">{s.descrizione}</p>}
                      <p className="text-red-600 font-bold text-sm mt-0.5">€{s.prezzo.toFixed(2)}</p>
                    </div>
                    <button
                      onClick={() => addToCart(s)}
                      className="ml-3 w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cart footer */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg p-4">
          <div className="max-w-2xl mx-auto">
            <textarea
              className="w-full border border-gray-200 rounded-lg p-3 text-sm mb-3 resize-none focus:outline-none focus:ring-2 focus:ring-red-300"
              rows={2}
              placeholder="Note sull'ordine (opzionale)..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <button
              onClick={handleOrdina}
              disabled={submitting}
              className="w-full bg-red-600 text-white py-3 rounded-xl font-bold text-base flex items-center justify-between px-4 hover:bg-red-700 disabled:opacity-60"
            >
              <span className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                {submitting ? 'Invio in corso...' : `Ordina · ${totalePezzi} ${totalePezzi === 1 ? 'prodotto' : 'prodotti'}`}
              </span>
              <span>€{totale.toFixed(2)}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
