import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SITE_URL = 'https://demo.restaurant-hub.it';

interface PageMeta {
  title: string;
  description: string;
  canonicalPath: string;
}

const LANDING: PageMeta = {
  title: 'Restaurant Hub — Gestionale per ristoranti: ordini, prenotazioni e menu digitale',
  description:
    'Gestionale per ristoranti: ordini sala-cucina in tempo reale, prenotazioni, tavoli e menu digitale con QR code. Prova gratis per 30 giorni.',
  canonicalPath: '/',
};

// Solo queste pagine sono indicizzabili; tutte le altre ricevono noindex.
const PUBLIC_PAGES: Record<string, PageMeta> = {
  '/': LANDING,
  '/landing': LANDING,
  '/privacy': {
    title: 'Privacy Policy | Restaurant Hub',
    description: 'Informativa sulla privacy di Restaurant Hub, il gestionale per ristoranti.',
    canonicalPath: '/privacy',
  },
  '/termini': {
    title: 'Termini di Servizio | Restaurant Hub',
    description: 'Termini e condizioni di utilizzo del servizio Restaurant Hub.',
    canonicalPath: '/termini',
  },
};

const PRIVATE_TITLE = 'Restaurant Hub — Gestionale';

function setMeta(selector: string, attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export default function RouteMeta() {
  const { pathname } = useLocation();

  useEffect(() => {
    const normalized = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
    const page = PUBLIC_PAGES[normalized];

    // Siti pubblici dei ristoranti: indicizzabili; il titolo lo imposta la pagina dopo il caricamento.
    if (!page && normalized.startsWith('/r/')) {
      setMeta('meta[name="robots"]', 'name', 'robots', 'index, follow');
      setCanonical(`${SITE_URL}${normalized}`);
      return;
    }

    if (page) {
      const url = `${SITE_URL}${page.canonicalPath}`;
      document.title = page.title;
      setMeta('meta[name="description"]', 'name', 'description', page.description);
      setMeta('meta[name="robots"]', 'name', 'robots', 'index, follow');
      setCanonical(url);
      setMeta('meta[property="og:title"]', 'property', 'og:title', page.title);
      setMeta('meta[property="og:description"]', 'property', 'og:description', page.description);
      setMeta('meta[property="og:url"]', 'property', 'og:url', url);
      setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', page.title);
      setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', page.description);
    } else {
      document.title = PRIVATE_TITLE;
      setMeta('meta[name="robots"]', 'name', 'robots', 'noindex, nofollow');
    }
  }, [pathname]);

  return null;
}
