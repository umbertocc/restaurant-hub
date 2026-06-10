// ── Ristorante ───────────────────────────────────────────────────────────────
export type Piano = 'FREE' | 'PRO' | 'ENTERPRISE';
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
export type CategoriaMenu =
  | 'ANTIPASTO'
  | 'PRIMO'
  | 'SECONDO'
  | 'CONTORNO'
  | 'DESSERT'
  | 'VINO_ROSSO'
  | 'VINO_BIANCO'
  | 'VINO_ROSE'
  | 'COCKTAIL'
  | 'BIBITA'
  | 'ACQUA'
  | 'PIZZA';

export interface MenuItem {
  id: number;
  ristoranteId: number;
  nome: string;
  descrizione?: string;
  categoria: CategoriaMenu;
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
  | 'ANNULLATO';

export interface OrdineItem {
  id: string;
  menuItemId: number;
  nomeMenuItem?: string;
  categoria?: CategoriaMenu;
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
