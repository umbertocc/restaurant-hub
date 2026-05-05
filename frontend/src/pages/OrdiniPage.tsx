import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { Plus, X, ShoppingCart, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getOrdini, createOrdine, updateStatoOrdine } from '../api/ordini';
import { getMenu } from '../api/menu';
import { Ordine, MenuItem, OrdineItemDTO, StatoOrdine } from '../types';

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

const FILTERS: { label: string; value: StatoOrdine | 'ALL' }[] = [
  { label: 'Tutti', value: 'ALL' },
  { label: 'Aperti', value: 'APERTO' },
  { label: 'In Preparazione', value: 'IN_PREPARAZIONE' },
  { label: 'Serviti', value: 'SERVITO' },
  { label: 'Chiusi', value: 'CHIUSO' },
  { label: 'Annullati', value: 'ANNULLATO' },
];

interface CartItem { menuItem: MenuItem; quantita: number; note: string }

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
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatoOrdine | 'ALL'>('ALL');
  const [showModal, setShowModal] = useState(false);
  const [newOrderAlert, setNewOrderAlert] = useState(false);
  const knownIds = useRef<Set<string>>(new Set());
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Sblocca AudioContext al primo gesto utente (autoplay policy)
  useEffect(() => {
    const unlock = () => {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      audioCtxRef.current.resume();
    };
    window.addEventListener('click', unlock);
    window.addEventListener('keydown', unlock);
    return () => {
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  const playBeep = () => {
    try {
      const ctx = audioCtxRef.current;
      if (!ctx || ctx.state !== 'running') return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } catch { /* ignorato */ }
  };

  // New order form state
  const [tavoloId, setTavoloId] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderNote, setOrderNote] = useState('');
  const [creating, setCreating] = useState(false);
  const [menuSearch, setMenuSearch] = useState('');

  const load = (isPolling = false) => {
    if (!ristorante) return;
    Promise.all([getOrdini(ristorante.id), getMenu(ristorante.id)])
      .then(([o, m]) => {
        const ordiniArr = (Array.isArray(o) ? o : []).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        const menuArr = Array.isArray(m) ? m : [];
        if (isPolling && knownIds.current.size > 0) {
          const nuovi = ordiniArr.filter((ord) => !knownIds.current.has(ord.id));
          if (nuovi.length > 0) {
            playBeep();
            setNewOrderAlert(true);
            setTimeout(() => setNewOrderAlert(false), 5000);
          }
        }
        ordiniArr.forEach((ord) => knownIds.current.add(ord.id));
        setOrdini(ordiniArr);
        setMenuItems(menuArr.filter((i) => i.disponibile));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') load(true);
    }, 8000);
    return () => clearInterval(interval);
  }, [ristorante]);

  const filtered = filter === 'ALL' ? ordini : ordini.filter((o) => o.stato === filter);

  const handleUpdateStato = async (id: string, stato: StatoOrdine) => {
    const updated = await updateStatoOrdine(id, stato);
    setOrdini((prev) => prev.map((o) => (o.id === id ? updated : o)));
  };

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItem.id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.menuItem.id === item.id ? { ...c, quantita: c.quantita + 1 } : c,
        );
      }
      return [...prev, { menuItem: item, quantita: 1, note: '' }];
    });
  };

  const removeFromCart = (id: number) =>
    setCart((prev) => prev.filter((c) => c.menuItem.id !== id));

  const updateCartQty = (id: number, q: number) => {
    if (q <= 0) { removeFromCart(id); return; }
    setCart((prev) => prev.map((c) => (c.menuItem.id === id ? { ...c, quantita: q } : c)));
  };

  const cartTotal = cart.reduce((s, c) => s + Number(c.menuItem.prezzo) * c.quantita, 0);

  const handleCreate = async () => {
    if (!ristorante || !tavoloId || cart.length === 0) return;
    setCreating(true);
    try {
      const items: OrdineItemDTO[] = cart.map((c) => ({
        menuItemId: c.menuItem.id,
        quantita: c.quantita,
        note: c.note || undefined,
      }));
      const newOrdine = await createOrdine({
        ristoranteId: ristorante.id,
        tavoloId: parseInt(tavoloId),
        items,
        note: orderNote || undefined,
      });
      setOrdini((prev) => [newOrdine, ...prev]);
      setShowModal(false);
      setCart([]);
      setTavoloId('');
      setOrderNote('');
    } finally {
      setCreating(false);
    }
  };

  const filteredMenu = menuItems.filter((m) =>
    m.nome.toLowerCase().includes(menuSearch.toLowerCase()),
  );

  if (loading) return <Spinner />;

  return (
    <div className="p-6 space-y-5">
      {newOrderAlert && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white px-6 py-3 rounded-xl shadow-lg font-semibold flex items-center gap-2 animate-bounce">
          🔔 Nuovo ordine ricevuto!
        </div>
      )}
      <div className="page-header">
        <div>
          <h1 className="page-title">Ordini</h1>
          <p className="text-sm text-gray-500 mt-0.5">{ordini.length} ordini totali</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary gap-2">
          <Plus className="w-4 h-4" />
          Nuovo ordine
        </button>
      </div>

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
                    {' · '}{o.items.length} voci · totale <strong className="text-gray-700">€{Number(o.totale).toFixed(2)}</strong>
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
              <h2 className="text-lg font-semibold">Nuovo ordine</h2>
              <button onClick={() => setShowModal(false)} className="btn-ghost p-1.5">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Table number */}
              <div className="max-w-xs">
                <label className="label">Numero tavolo *</label>
                <input
                  type="number"
                  min="1"
                  className="input"
                  placeholder="Es. 4"
                  value={tavoloId}
                  onChange={(e) => setTavoloId(e.target.value)}
                />
              </div>

              {/* Menu search */}
              <div>
                <label className="label">Aggiungi piatti</label>
                <input
                  type="text"
                  className="input mb-3"
                  placeholder="Cerca nel menu…"
                  value={menuSearch}
                  onChange={(e) => setMenuSearch(e.target.value)}
                />
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
                        key={c.menuItem.id}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800">{c.menuItem.nome}</p>
                          <p className="text-xs text-gray-400">€{Number(c.menuItem.prezzo).toFixed(2)} × {c.quantita} = €{(Number(c.menuItem.prezzo) * c.quantita).toFixed(2)}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => updateCartQty(c.menuItem.id, c.quantita - 1)}
                            className="w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 flex items-center justify-center text-xs font-bold"
                          >−</button>
                          <span className="w-6 text-center text-sm font-semibold">{c.quantita}</span>
                          <button
                            onClick={() => updateCartQty(c.menuItem.id, c.quantita + 1)}
                            className="w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 flex items-center justify-center text-xs font-bold"
                          >+</button>
                          <button
                            onClick={() => removeFromCart(c.menuItem.id)}
                            className="ml-1 p-1 text-red-400 hover:text-red-600"
                          ><X className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-end pt-1">
                      <span className="font-bold text-gray-900">Totale: € {cartTotal.toFixed(2)}</span>
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
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t">
              <button onClick={() => setShowModal(false)} className="btn-secondary">Annulla</button>
              <button
                onClick={handleCreate}
                disabled={creating || !tavoloId || cart.length === 0}
                className="btn-primary"
              >
                {creating ? 'Creazione…' : 'Crea ordine'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
