import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChefHat, MapPin, Phone, Clock, Instagram, Facebook, CalendarDays } from 'lucide-react';
import { getSitoPubblico } from '../api/sito';
import { CategoriaMenu, PublicSito, PublicSitoVoce } from '../types';

const ORDINE_CATEGORIE: CategoriaMenu[] = [
  'ANTIPASTO', 'PIZZA', 'PRIMO', 'SECONDO', 'CONTORNO', 'DESSERT',
  'VINO_ROSSO', 'VINO_BIANCO', 'VINO_ROSE', 'COCKTAIL', 'BIBITA', 'ACQUA',
];

const CATEGORIA_LABEL: Record<CategoriaMenu, string> = {
  ANTIPASTO: 'Antipasti', PRIMO: 'Primi', SECONDO: 'Secondi',
  CONTORNO: 'Contorni', DESSERT: 'Dessert',
  VINO_ROSSO: 'Vini rossi', VINO_BIANCO: 'Vini bianchi', VINO_ROSE: 'Vini rosé',
  COCKTAIL: 'Cocktail', BIBITA: 'Bibite', ACQUA: 'Acqua',
  PIZZA: 'Pizze',
};

const euro = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' });

// Le URL arrivano dal database: le usiamo solo se http(s), mai javascript: o simili.
const safeUrl = (url?: string | null) => (url && /^https?:\/\//i.test(url) ? url : undefined);

export default function PublicSitoPage() {
  const { slug } = useParams<{ slug: string }>();
  const [sito, setSito] = useState<PublicSito | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    getSitoPubblico(slug)
      .then((data) => {
        setSito(data);
        document.title = `${data.nome}${data.citta ? ` — ${data.citta}` : ''}`;
        const desc = document.head.querySelector<HTMLMetaElement>('meta[name="description"]');
        if (desc && data.descrizione) desc.setAttribute('content', data.descrizione.slice(0, 160));
      })
      .catch(() => setSito(null))
      .finally(() => setLoading(false));
  }, [slug]);

  const sezioni = useMemo(() => {
    const perCategoria = new Map<CategoriaMenu, PublicSitoVoce[]>();
    (sito?.menu ?? []).forEach((v) => {
      perCategoria.set(v.categoria, [...(perCategoria.get(v.categoria) ?? []), v]);
    });
    return ORDINE_CATEGORIE.filter((c) => perCategoria.has(c)).map((c) => ({
      categoria: c,
      voci: perCategoria.get(c)!,
    }));
  }, [sito]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">
        Caricamento…
      </div>
    );
  }

  if (!sito) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
        <ChefHat className="w-10 h-10 text-gray-400 mb-3" />
        <h1 className="text-xl font-bold text-gray-900 mb-1">Sito non disponibile</h1>
        <p className="text-gray-500 text-sm">Questa pagina non esiste o non è ancora stata pubblicata.</p>
      </div>
    );
  }

  const copertina = safeUrl(sito.copertinaUrl);
  const logo = safeUrl(sito.logoUrl);
  const instagram = safeUrl(sito.instagramUrl);
  const facebook = safeUrl(sito.facebookUrl);
  const indirizzoCompleto = [sito.indirizzo, sito.citta].filter(Boolean).join(', ');
  const mapsUrl = indirizzoCompleto
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${sito.nome} ${indirizzoCompleto}`)}`
    : undefined;
  const prenotaPath = `/prenota/${sito.ristoranteId}`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <header
        className="relative bg-gray-900 text-white"
        style={copertina ? { backgroundImage: `url("${copertina}")`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
      >
        <div className={copertina ? 'bg-black/55' : 'bg-gradient-to-b from-gray-900 to-gray-800'}>
          <div className="max-w-3xl mx-auto px-4 py-14 text-center">
            {logo ? (
              <img src={logo} alt={sito.nome} className="h-20 object-contain mx-auto mb-4" />
            ) : (
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-600 rounded-2xl mb-4">
                <ChefHat className="w-8 h-8 text-white" />
              </div>
            )}
            <h1 className="text-3xl sm:text-4xl font-bold">{sito.nome}</h1>
            {sito.citta && <p className="text-gray-200 mt-1">{sito.citta}</p>}
            <Link
              to={prenotaPath}
              className="inline-flex items-center gap-2 mt-6 bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              <CalendarDays className="w-5 h-5" />
              Prenota un tavolo
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {sito.descrizione && (
          <section>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">{sito.descrizione}</p>
          </section>
        )}

        {/* Informazioni */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 grid gap-4 sm:grid-cols-2">
          {indirizzoCompleto && (
            <div className="flex gap-3">
              <MapPin className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-gray-900">Dove siamo</p>
                <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-red-600">
                  {indirizzoCompleto}
                </a>
              </div>
            </div>
          )}
          {sito.telefono && (
            <div className="flex gap-3">
              <Phone className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-gray-900">Telefono</p>
                <a href={`tel:${sito.telefono.replace(/[^+\d]/g, '')}`} className="text-gray-600 hover:text-red-600">
                  {sito.telefono}
                </a>
              </div>
            </div>
          )}
          {sito.orari && (
            <div className="flex gap-3 sm:col-span-2">
              <Clock className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-gray-900">Orari</p>
                <p className="text-gray-600 whitespace-pre-line">{sito.orari}</p>
              </div>
            </div>
          )}
          {(instagram || facebook) && (
            <div className="flex gap-4 sm:col-span-2">
              {instagram && (
                <a href={instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-red-600">
                  <Instagram className="w-4 h-4" /> Instagram
                </a>
              )}
              {facebook && (
                <a href={facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-red-600">
                  <Facebook className="w-4 h-4" /> Facebook
                </a>
              )}
            </div>
          )}
        </section>

        {/* Menu */}
        {sezioni.length > 0 && (
          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Menu</h2>
            {sezioni.map(({ categoria, voci }) => (
              <div key={categoria}>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-red-600 mb-2">
                  {CATEGORIA_LABEL[categoria]}
                </h3>
                <ul className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-100">
                  {voci.map((v) => {
                    const img = safeUrl(v.immagineUrl);
                    return (
                      <li key={v.id} className="flex gap-4 p-4">
                        {img && (
                          <img src={img} alt={v.nome} loading="lazy" className="w-20 h-20 rounded-xl object-cover shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between gap-3">
                            <p className="font-semibold text-gray-900">{v.nome}</p>
                            <p className="font-semibold text-gray-900 whitespace-nowrap">{euro.format(v.prezzo)}</p>
                          </div>
                          {v.descrizione && <p className="text-sm text-gray-600 mt-0.5">{v.descrizione}</p>}
                          {v.allergeni && <p className="text-xs text-gray-400 mt-1">Allergeni: {v.allergeni}</p>}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </section>
        )}

        <div className="text-center">
          <Link
            to={prenotaPath}
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            <CalendarDays className="w-5 h-5" />
            Prenota un tavolo
          </Link>
        </div>
      </main>

      <footer className="text-center text-xs text-gray-400 py-6">
        Realizzato con Restaurant Hub
      </footer>
    </div>
  );
}
