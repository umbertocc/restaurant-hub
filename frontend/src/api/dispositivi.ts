import client from './client';
import { DeviceActivationResponse, Dispositivo, RuoloDispositivo } from '../types';

export const getDispositivi = (ristoranteId: number) =>
  client.get<Dispositivo[]>(`/ristoranti/${ristoranteId}/dispositivi`).then((r) => r.data);

export const creaDispositivo = (ristoranteId: number, data: { nome: string; ruolo: RuoloDispositivo }) =>
  client.post<Dispositivo>(`/ristoranti/${ristoranteId}/dispositivi`, data).then((r) => r.data);

export const revocaDispositivo = (ristoranteId: number, dispositivoId: number) =>
  client.delete<Dispositivo>(`/ristoranti/${ristoranteId}/dispositivi/${dispositivoId}`).then((r) => r.data);

export const rigeneraCodice = (ristoranteId: number, dispositivoId: number) =>
  client.post<Dispositivo>(`/ristoranti/${ristoranteId}/dispositivi/${dispositivoId}/rigenera`).then((r) => r.data);

export const impostaBloccoDispositivo = (ristoranteId: number, dispositivoId: number, bloccato: boolean) =>
  client
    .put<Dispositivo>(`/ristoranti/${ristoranteId}/dispositivi/${dispositivoId}/blocco`, { bloccato })
    .then((r) => r.data);

// Usa il token del login standard per scambiarlo con quello del dispositivo
export const attivaDispositivo = (codice: string, token: string) =>
  client
    .post<DeviceActivationResponse>(
      '/auth/device-activate',
      { codice },
      { headers: { Authorization: `Bearer ${token}` } },
    )
    .then((r) => r.data);
