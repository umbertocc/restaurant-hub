import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { Plus, X, ShoppingCart, ChevronRight, TableProperties, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getOrdini, createOrdine, updateOrdine, updateStatoOrdine } from '../api/ordini';
import { getCategorieMenu, getMenu } from '../api/menu';
import { getTavoli } from '../api/tavoli';
import { ORDERS_CHANGED_EVENT } from '../realtime/ordersRealtime';
import { getOrdiniOccupantiTavolo } from '../utils/ordini';
import { Ordine, MenuItem, OrdineItemDTO, StatoOrdine, MenuCategoria, Tavolo } from '../types';

const STATO_STYLE: Record<StatoOrdine, string> = {
  APERTO: 'badge bg-blue-100 text-blue-700',
  IN_PREPARAZIONE: 'badge bg-amber-100 text-amber-700',
  SERVITO: 'badge bg-green-100 text-green-700',
  CHIUSO: 'badge bg-gray-100 text-gray-500',
  PAGATO: 'badge bg-purple-100 text-purple-700',
  ANNULLATO: 'badge bg-red-100 text-red-700',
};

const STATO_LABEL: Record<StatoOrdine, string> = {
  APERTO: 'Aperto',
  IN_PREPARAZIONE: 'In Preparazione',
  SERVITO: 'Servito',
  CHIUSO: 'Chiuso',
  PAGATO: 'Pagato',
  ANNULLATO: 'Annullato',
};

const STATI_AVANZAMENTO: Record<StatoOrdine, StatoOrdine | null> = {
  APERTO: 'IN_PREPARAZIONE',
  IN_PREPARAZIONE: 'SERVITO',
  SERVITO: 'CHIUSO',
  CHIUSO: null,
  PAGATO: null,
  ANNULLATO: null,
};

const FILTERS: { label: string; value: StatoOrdine | 'ALL' }[] = [
  { label: 'Tutti', value: 'ALL' },
  { label: 'Aperti', value: 'APERTO' },
  { label: 'In Preparazione', value: 'IN_PREPARAZIONE' },
  { label: 'Serviti', value: 'SERVITO' },
  { label: 'Chiusi', value: 'CHIUSO' },
  { label: 'Pagati', value: 'PAGATO' },
  { label: 'Annullati', value: 'ANNULLATO' },
];

interface CartItem { menuItemId: number; nome: string; prezzo: number; quantita: number; note: string }

function safeFormat(iso: string): string {
  try { return format(parseISO(iso), "d MMM yyyy 'alle' HH:mm", { locale: it }); }
  catch { return '—'; }
}

function Spinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function OrdiniPage() {
  const { ristorante } = useAuth();
  const [ordini, setOrdini] = useState<Ordine[]>([]);
  const [tavoli, setTavoli] = useState<Tavolo[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categorie, setCategorie] = useState<MenuCategoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [filter, setFilter] = useState<StatoOrdine | 'ALL'>('APERTO');
  const [showModal, setShowModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Ordine | null>(null);

  // New order form state
  const [tavoloId, setTavoloId] = useState('');
  const [coperti, setCoperti] = useState(1);
  const [copertiInput, setCopertiInput] = useState('1');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderNote, setOrderNote] = useState('');
  const [creating, setCreating] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [menuSearch, setMenuSearch] = useState('');
  const [menuCatFilter, setMenuCatFilter] = useState<number | 'ALL'>('ALL');

  const load = () => {
    if (!ristorante) return;
    Promise.all([getOrdini(), getMenu(ristorante.id), getCategorieMenu(ristorante.id), getTavoli()])
      .then(([o, m, c, t]) => {
        const ordiniArr = (Array.isArray(o) ? o : []).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        const menuArr = Array.isArray(m) ? m : [];
        setOrdini(ordiniArr);
        setTavoli(Array.isArray(t) ? t : []);
        setMenuItems(menuArr);
        setCategorie(Array.isArray(c) ? c : []);
      })
      .catch(() => setLoadError('Errore nel caricamento di ordini e tavoli'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [ristorante]);

  useEffect(() => {
    const onOrdersChanged = () => {
      getOrdini()
        .then((data) => {
          const ordiniArr = (Array.isArray(data) ? data : [])
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
          setOrdini(ordiniArr);
          setLoadError('');
        })
        .catch(() => setLoadError('Errore nell’aggiornamento degli ordini'));
    };

    window.addEventListener(ORDERS_CHANGED_EVENT, onOrdersChanged);
    return () => window.removeEventListener(ORDERS_CHANGED_EVENT, onOrdersChanged);
  }, []);

  const filtered = filter === 'ALL' ? ordini : ordini.filter((o) => o.stato === filter);
  const tavoliOrdinati = [...tavoli].sort((a, b) => a.numero - b.numero);
  const ordiniAttivi = getOrdiniOccupantiTavolo(ordini);
  const tavoliLiberi = tavoliOrdinati.filter(
    (t) => t.disponibile && !ordiniAttivi.some((o) => o.tavoloId === t.id),
  );

  const handleUpdateStato = async (id: string, stato: StatoOrdine) => {
    const updated = await updateStatoOrdine(id, stato);
    setOrdini((prev) => prev.map((o) => (o.id === id ? updated : o)));
  };

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItemId === item.id);
      if (existing) {
        return prev.map((c) =>
          c.menuItemId === item.id ? { ...c, quantita: c.quantita + 1 } : c,
        );
      }
      return [...prev, { menuItemId: item.id, nome: item.nome, prezzo: Number(item.prezzo), quantita: 1, note: '' }];
    });
  };

  const removeFromCart = (id: number) =>
    setCart((prev) => prev.filter((c) => c.menuItemId !== id));

  const updateCartQty = (id: number, q: number) => {
    if (q <= 0) { removeFromCart(id); return; }
    setCart((prev) => prev.map((c) => (c.menuItemId === id ? { ...c, quantita: q } : c)));
  };

  const prodottiTotal = cart.reduce((s, c) => s + c.prezzo * c.quantita, 0);
  const prezzoCoperto = Number(editingOrder?.prezzoCoperto ?? ristorante?.prezzoCoperto ?? 0);
  const cartTotal = prodottiTotal + coperti * prezzoCoperto;

  const openNewOrder = (tavolo?: Tavolo) => {
    setEditingOrder(null);
    setTavoloId(tavolo ? String(tavolo.id) : '');
    setCoperti(1);
    setCopertiInput('1');
    setCart([]);
    setOrderNote('');
    setSaveError('');
    setMenuSearch('');
    setMenuCatFilter('ALL');
    setShowModal(true);
  };

  const openOrderForTable = (tavolo: Tavolo) => {
    const ordine = ordiniAttivi.find((o) => o.tavoloId === tavolo.id);
    if (ordine?.stato === 'CHIUSO') return;
    if (!ordine) {
      if (tavolo.disponibile) openNewOrder(tavolo);
      return;
    }

    setEditingOrder(ordine);
    setTavoloId(String(tavolo.id));
    setCoperti(ordine.coperti);
    setCopertiInput(String(ordine.coperti));
    setCart(ordine.items.map((item) => {
      const menuItem = menuItems.find((m) => m.id === item.menuItemId);
      return {
        menuItemId: item.menuItemId,
        nome: menuItem?.nome ?? item.nomeMenuItem ?? `Prodotto ${item.menuItemId}`,
        prezzo: Number(menuItem?.prezzo ?? item.prezzoUnitario),
        quantita: item.quantita,
        note: item.note ?? '',
      };
    }));
    setOrderNote(ordine.note ?? '');
    setSaveError('');
    setShowModal(true);
  };

  const closeOrderModal = () => {
    if (creating) return;
    setShowModal(false);
    setEditingOrder(null);
    setSaveError('');
  };

  const handleSave = async () => {
    if (!ristorante || !tavoloId || cart.length === 0) return;
    setCreating(true);
    setSaveError('');
    try {
      const items: OrdineItemDTO[] = cart.map((c) => ({
        menuItemId: c.menuItemId,
        quantita: c.quantita,
        note: c.note || undefined,
      }));
      const data = {
        ristoranteId: ristorante.id,
        tavoloId: parseInt(tavoloId),
        coperti,
        items,
        note: orderNote || undefined,
      };
      const savedOrdine = editingOrder
        ? await updateOrdine(editingOrder.id, data)
        : await createOrdine(data);
      setOrdini((prev) => editingOrder
        ? prev.map((o) => (o.id === savedOrdine.id ? savedOrdine : o))
        : [savedOrdine, ...prev]);
      setShowModal(false);
      setEditingOrder(null);
      setCart([]);
      setTavoloId('');
      setCoperti(1);
      setCopertiInput('1');
      setOrderNote('');
      setMenuSearch('');
      setMenuCatFilter('ALL');
    } catch {
      setSaveError('Errore nel salvataggio dell’ordine. Riprova.');
    } finally {
      setCreating(false);
    }
  };

  const filteredMenu = menuItems.filter((m) => {
    const matchSearch = m.nome.toLowerCase().includes(menuSearch.toLowerCase());
    const matchCat = menuCatFilter === 'ALL'
      ? true
      : m.categoria.id === menuCatFilter;
    return m.disponibile && matchSearch && matchCat;
  });

  if (loading) return <Spinner />;

  return (
    <div className="p-6 space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Ordini</h1>
          <p className="text-sm text-gray-500 mt-0.5">{ordini.length} ordini totali</p>
        </div>
        <button onClick={() => openNewOrder()} disabled={tavoliLiberi.length === 0} className="btn-primary gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
          <Plus className="w-4 h-4" />
          Nuovo ordine
        </button>
      </div>

      {loadError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {loadError}
        </div>
      )}

      <section className="card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Tavoli in sala</h2>
            <p className="text-sm text-gray-500">Stato aggiornato in base agli ordini</p>
          </div>
          <div className="flex gap-3 text-xs font-medium">
            <span className="flex items-center gap-1.5 text-green-700">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
              {tavoliOrdinati.filter((t) => t.disponibile && !ordiniAttivi.some((o) => o.tavoloId === t.id)).length} liberi
            </span>
            <span className="flex items-center gap-1.5 text-red-700">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              {tavoliOrdinati.filter((t) => ordiniAttivi.some((o) => o.tavoloId === t.id)).length} occupati
            </span>
          </div>
        </div>

        {tavoliOrdinati.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">Nessun tavolo configurato</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {tavoliOrdinati.map((tavolo) => {
              const ordineAttivo = ordiniAttivi.find((o) => o.tavoloId === tavolo.id);
              const libero = tavolo.disponibile && !ordineAttivo;
              const statoLabel = ordineAttivo
                ? `Occupato · ${STATO_LABEL[ordineAttivo.stato]}`
                : tavolo.disponibile
                  ? 'Libero'
                  : 'Non disponibile';
              return (
                <button
                  key={tavolo.id}
                  type="button"
                  onClick={() => openOrderForTable(tavolo)}
                  disabled={ordineAttivo?.stato === 'CHIUSO' || (!ordineAttivo && !tavolo.disponibile)}
                  aria-label={`Tavolo ${tavolo.numero}, ${statoLabel}, ${tavolo.capacita} posti`}
                  className={`rounded-xl border p-4 text-left transition-shadow ${
                    libero
                      ? 'border-green-200 bg-green-50'
                      : ordineAttivo
                        ? 'border-red-200 bg-red-50'
                        : 'border-gray-200 bg-gray-50'
                  } ${ordineAttivo?.stato !== 'CHIUSO' && (tavolo.disponibile || ordineAttivo) ? 'hover:shadow-md cursor-pointer' : 'cursor-not-allowed opacity-75'}`}
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
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Status filter tabs */}
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

      {/* Orders list */}
      {filtered.length === 0 ? (
        <div className="card flex flex-col items-center py-16 text-gray-400">
          <ShoppingCart className="w-10 h-10 mb-2 opacity-50" />
          <p className="text-sm">Nessun ordine trovato</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((o) => {
            const next = STATI_AVANZAMENTO[o.stato];
            return (
              <div
                key={o.id}
                className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900">Tavolo {o.tavoloId}</span>
                    <span className={STATO_STYLE[o.stato]}>{STATO_LABEL[o.stato]}</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    {safeFormat(o.createdAt)}
                    {' · '}{o.coperti} {o.coperti === 1 ? 'coperto' : 'coperti'} · {o.items.length} voci · totale <strong className="text-gray-700">€{Number(o.totale).toFixed(2)}</strong>
                  </p>
                  {o.note && <p className="text-xs text-gray-500 mt-0.5 italic">"{o.note}"</p>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {next && (
                    <button
                      onClick={() => handleUpdateStato(o.id, next)}
                      className="btn-primary text-xs py-1.5 px-3"
                    >
                      → {STATO_LABEL[next]}
                    </button>
                  )}
                  {o.stato === 'APERTO' && (
                    <button
                      onClick={() => handleUpdateStato(o.id, 'ANNULLATO')}
                      className="text-xs py-1.5 px-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      Annulla
                    </button>
                  )}
                  <Link
                    to={`/ordini/${o.id}`}
                    className="btn-ghost text-xs py-1.5 px-2"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New order modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">
                {editingOrder ? `Modifica ordine · Tavolo ${tavoli.find((t) => t.id === editingOrder.tavoloId)?.numero ?? editingOrder.tavoloId}` : 'Nuovo ordine'}
              </h2>
              <button onClick={closeOrderModal} className="btn-ghost p-1.5" disabled={creating}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="max-w-xs">
                <label className="label">Tavolo *</label>
                {editingOrder ? (
                  <p className="input bg-gray-50">
                    Tavolo {tavoli.find((t) => t.id === editingOrder.tavoloId)?.numero ?? editingOrder.tavoloId}
                  </p>
                ) : (
                  <select
                    className="input"
                    value={tavoloId}
                    onChange={(e) => setTavoloId(e.target.value)}
                  >
                    <option value="">Seleziona un tavolo libero</option>
                    {tavoliLiberi.map((tavolo) => (
                      <option key={tavolo.id} value={tavolo.id}>
                        Tavolo {tavolo.numero} · {tavolo.capacita} {tavolo.capacita === 1 ? 'posto' : 'posti'}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div className="max-w-xs">
                <label className="label">Numero coperti *</label>
                <input
                  type="number"
                  min="1"
                  className="input"
                  value={copertiInput}
                  onChange={(e) => {
                    setCopertiInput(e.target.value);
                    const n = parseInt(e.target.value, 10);
                    if (n >= 1) setCoperti(n);
                  }}
                  onBlur={() => setCopertiInput(String(coperti))}
                />
                {prezzoCoperto > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    €{prezzoCoperto.toFixed(2)} a persona · €{(prezzoCoperto * coperti).toFixed(2)} totali
                  </p>
                )}
              </div>

              {/* Menu search */}
              <div>
                <label className="label">Aggiungi piatti</label>
                <input
                  type="text"
                  className="input mb-2"
                  placeholder="Cerca nel menu…"
                  value={menuSearch}
                  onChange={(e) => setMenuSearch(e.target.value)}
                />
                <div className="flex gap-1.5 flex-wrap mb-3">
                  {[{ id: 'ALL' as const, nome: 'Tutti' }, ...categorie].map((categoria) => (
                    <button
                      key={categoria.id}
                      type="button"
                      onClick={() => setMenuCatFilter(categoria.id)}
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                        menuCatFilter === categoria.id
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {categoria.nome}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                  {filteredMenu.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => addToCart(m)}
                      className="flex items-center justify-between p-2.5 bg-gray-50 hover:bg-red-50 rounded-lg text-left transition-colors border border-transparent hover:border-red-200"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-800">{m.nome}</p>
                        <p className="text-xs text-gray-400">€{Number(m.prezzo).toFixed(2)}</p>
                      </div>
                      <Plus className="w-4 h-4 text-red-500 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Cart */}
              {cart.length > 0 && (
                <div>
                  <label className="label">Carrello</label>
                  <div className="space-y-2">
                    {cart.map((c) => (
                      <div
                        key={c.menuItemId}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800">{c.nome}</p>
                          <p className="text-xs text-gray-400">€{c.prezzo.toFixed(2)} × {c.quantita} = €{(c.prezzo * c.quantita).toFixed(2)}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => updateCartQty(c.menuItemId, c.quantita - 1)}
                            className="w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 flex items-center justify-center text-xs font-bold"
                          >−</button>
                          <span className="w-6 text-center text-sm font-semibold">{c.quantita}</span>
                          <button
                            onClick={() => updateCartQty(c.menuItemId, c.quantita + 1)}
                            className="w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 flex items-center justify-center text-xs font-bold"
                          >+</button>
                          <button
                            onClick={() => removeFromCart(c.menuItemId)}
                            className="ml-1 p-1 text-red-400 hover:text-red-600"
                          ><X className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-end pt-1">
                      <span className="font-bold text-gray-900">Totale ordine: € {cartTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Note */}
              <div>
                <label className="label">Note ordine</label>
                <textarea
                  className="input resize-none"
                  rows={2}
                  placeholder="Es. allergie, preferenze…"
                  value={orderNote}
                  onChange={(e) => setOrderNote(e.target.value)}
                />
              </div>
              {saveError && (
                <div role="alert" className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  {saveError}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t">
              <button onClick={closeOrderModal} className="btn-secondary" disabled={creating}>Annulla</button>
              <button
                onClick={handleSave}
                disabled={creating || !tavoloId || cart.length === 0}
                className="btn-primary"
              >
                {creating ? 'Salvataggio…' : editingOrder ? 'Salva modifiche' : 'Crea ordine'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
