import type { Profilo } from '../context/AuthContext';

// Profili che possono aprire ciascuna sezione (usato da guardia delle rotte)
export const ROUTE_PROFILI: Record<string, Profilo[]> = {
  '/':             ['admin'],
  '/menu':         ['admin'],
  '/ordini':       ['admin', 'cameriere'],
  '/tavoli':       ['admin', 'cameriere'],
  '/prenotazioni': ['admin'],
  '/abbinamenti':  ['admin'],
  '/cucina':       ['admin', 'cuoco'],
  '/bar':          ['admin', 'barista', 'cameriere'],
  '/pizzeria':     ['admin', 'pizzaiolo'],
  '/sala':         ['admin', 'cameriere'],
  '/profilo':      ['admin'],
  '/sito':         ['admin'],
  '/abbonamento':  ['admin'],
  '/dispositivi':  ['admin'],
};

// Pagina iniziale di ogni profilo
export const PROFILO_HOME: Record<Profilo, string> = {
  admin:     '/',
  cameriere: '/sala',
  cuoco:     '/cucina',
  barista:   '/bar',
  pizzaiolo: '/pizzeria',
};

export function profiloPuoAprire(profilo: Profilo, pathname: string): boolean {
  const base = '/' + (pathname.split('/')[1] ?? '');
  const consentiti = ROUTE_PROFILI[base];
  return !consentiti || consentiti.includes(profilo);
}
