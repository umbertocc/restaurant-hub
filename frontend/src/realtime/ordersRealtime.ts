import { Client } from '@stomp/stompjs';

export const ORDERS_CHANGED_EVENT = 'rh:orders-changed';

export interface OrdineRealtimeMessage {
  type: 'CREATED' | 'STATUS_UPDATED';
  ordineId: string;
  stato: string;
  ristoranteId: number;
  timestamp: string;
}

let activeClient: Client | null = null;

function normalizeApiBase(raw: string): string {
  if (!raw) return window.location.origin;
  const trimmed = raw.trim().replace(/\/+$/, '');
  if (trimmed.endsWith('/api')) return trimmed.slice(0, -4);
  return trimmed;
}

function toWsUrl(baseHttpUrl: string): string {
  const url = new URL(baseHttpUrl);
  const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${url.host}/ws`;
}

export function stopOrdersRealtime(): void {
  if (activeClient) {
    activeClient.deactivate();
    activeClient = null;
  }
}

export function startOrdersRealtime(args: {
  token: string;
  ristoranteId: number;
  onOrderChanged?: (payload: OrdineRealtimeMessage) => void;
}): void {
  const { token, ristoranteId, onOrderChanged } = args;

  stopOrdersRealtime();

  const apiBase = normalizeApiBase(import.meta.env.VITE_API_URL ?? '');
  const brokerURL = toWsUrl(apiBase);
  const destination = `/topic/ristorante.${ristoranteId}.ordini`;

  const client = new Client({
    brokerURL,
    reconnectDelay: 5000,
    connectHeaders: {
      Authorization: `Bearer ${token}`,
    },
    onConnect: () => {
      client.subscribe(destination, (frame) => {
        let payload: OrdineRealtimeMessage | null = null;
        try {
          payload = JSON.parse(frame.body) as OrdineRealtimeMessage;
        } catch {
          payload = null;
        }

        if (payload) {
          if (onOrderChanged) onOrderChanged(payload);
          window.dispatchEvent(new CustomEvent(ORDERS_CHANGED_EVENT, { detail: payload }));
        }
      });
    },
    onStompError: (frame) => {
      console.error('STOMP error', frame.headers['message'], frame.body);
    },
    onWebSocketError: (event) => {
      console.error('WebSocket error', event);
    },
  });

  client.activate();
  activeClient = client;
}
