// ── Ristorante ───────────────────────────────────────────────────────────────
export type Piano = 'FREE' | 'PRO';
export type SubscriptionStatus =
  | 'TRIAL_ACTIVE'
  | 'TRIAL_GRACE'
  | 'EXPIRED_TRIAL'
  | 'ACTIVE_PAID'
  | 'CANCELED';

export interface Ristorante {
  id: number;
  nome: string;
  email: string;
  telefono?: string;
  indirizzo?: string;
  citta?: string;
  logoUrl?: string;
  prezzoCoperto: number;
  piano: Piano;
  subscriptionStatus?: SubscriptionStatus;
  attivo: boolean;
  trialStartAt?: string;
  trialEndAt?: string;
  trialGraceEndAt?: string;
  trialExpired?: boolean;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionCurrentPeriodEnd?: string;
  subscriptionCancelAtPeriodEnd?: boolean;
  createdAt: string;
}

// ── Sito pubblico ────────────────────────────────────────────────────────────
export interface SitoConfig {
  slug?: string | null;
  descrizione?: string | null;
  orari?: string | null;
  copertinaUrl?: string | null;
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  sitoPubblicato: boolean;
}

export interface PublicSitoVoce {
  id: number;
  nome: string;
  descrizione?: string;
  categoria: string;
  descrizioneCategoria?: string;
  prezzo: number;
  immagineUrl?: string;
  allergeni?: string;
}

export interface PublicSito {
  ristoranteId: number;
  nome: string;
  descrizione?: string;
  indirizzo?: string;
  citta?: string;
  telefono?: string;
  orari?: string;
  logoUrl?: string;
  copertinaUrl?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  menu: PublicSitoVoce[];
}

// ── Tavoli ───────────────────────────────────────────────────────────────────
export interface Tavolo {
  id: number;
  ristoranteId: number;
  numero: number;
  capacita: number;
  disponibile: boolean;
  posizione?: string;
}

// ── Menu ─────────────────────────────────────────────────────────────────────
export type DestinazioneMenu = 'CUCINA' | 'BAR' | 'PIZZERIA';

export interface MenuCategoria {
  id: number;
  ristoranteId: number;
  nome: string;
  descrizione?: string;
  destinazione: DestinazioneMenu;
}

export interface MenuItem {
  id: number;
  ristoranteId: number;
  nome: string;
  descrizione?: string;
  categoria: MenuCategoria;
  prezzo: number;
  disponibile: boolean;
  immagineUrl?: string;
  allergeni?: string;
}

// ── Ordini ───────────────────────────────────────────────────────────────────
export type StatoOrdine =
  | 'APERTO'
  | 'IN_PREPARAZIONE'
  | 'SERVITO'
  | 'CHIUSO'
  | 'PAGATO'
  | 'ANNULLATO';

export interface OrdineItem {
  id: string;
  menuItemId: number;
  nomeMenuItem?: string;
  categoria?: string;
  destinazione?: DestinazioneMenu;
  quantita: number;
  prezzoUnitario: number;
  note?: string;
  subtotale: number;
}

export interface Ordine {
  id: string;
  ristoranteId: number;
  tavoloId: number;
  prenotazioneId?: string;
  stato: StatoOrdine;
  totale: number;
  coperti: number;
  prezzoCoperto: number;
  note?: string;
  createdAt: string;
  chiusoAt?: string;
  items: OrdineItem[];
}

export interface OrdineItemDTO {
  menuItemId: number;
  quantita: number;
  note?: string;
}

export interface OrdineDTO {
  ristoranteId: number;
  tavoloId: number;
  coperti: number;
  prenotazioneId?: string;
  items: OrdineItemDTO[];
  note?: string;
}

// ── Prenotazioni ─────────────────────────────────────────────────────────────
export type StatoPrenotazione =
  | 'IN_ATTESA'
  | 'CONFERMATA'
  | 'ANNULLATA'
  | 'COMPLETATA';

export interface Prenotazione {
  id: string;
  ristoranteId: number;
  tavoloId?: number;
  clienteNome: string;
  clienteEmail?: string;
  clienteTelefono?: string;
  dataOra: string;
  coperti: number;
  note?: string;
  stato: StatoPrenotazione;
  createdAt: string;
}

export interface PrenotazioneDTO {
  ristoranteId: number;
  tavoloId?: number;
  clienteNome: string;
  clienteEmail?: string;
  clienteTelefono?: string;
  dataOra: string;
  coperti: number;
  note?: string;
}

// ── Abbinamenti ──────────────────────────────────────────────────────────────
export type TipoAbbinamento = 'VINO' | 'COCKTAIL' | 'BIBITA' | 'DESSERT';

export interface Abbinamento {
  id: number;
  piattoId: number;
  abbinamentoItemId: number;
  score: number;
  tipo: TipoAbbinamento;
  descrizione?: string;
}

// ── Auth ─────────────────────────────────────────────────────────────────────
export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  ristorante: Ristorante;
  ruoli: string[];
}

// -- Dispositivi --------------------------------------------------------------
export type RuoloDispositivo = 'admin' | 'cameriere' | 'cuoco' | 'barista' | 'pizzaiolo';

export interface Dispositivo {
  id: number;
  ristoranteId: number;
  nome: string;
  ruolo: RuoloDispositivo;
  createdAt: string;
  lastUsedAt?: string | null;
  revokedAt?: string | null;
  bloccatoAt?: string | null;
  // Presente solo nella risposta di creazione/rigenerazione
  codice?: string;
}

export interface DeviceActivationResponse {
  token: string;
  profilo: RuoloDispositivo;
  dispositivo: Dispositivo;
}
