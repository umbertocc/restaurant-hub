import client from './client';
import { Ordine, OrdineDTO, StatoOrdine } from '../types';

export const getOrdini = () =>
  client.get<Ordine[]>('/ordini').then((r) => r.data);

export const getOrdine = (id: string) =>
  client.get<Ordine>(`/ordini/${id}`).then((r) => r.data);

export const createOrdine = (data: OrdineDTO) =>
  client.post<Ordine>('/ordini', data).then((r) => r.data);

export const updateOrdine = (id: string, data: OrdineDTO) =>
  client.put<Ordine>(`/ordini/${id}`, data).then((r) => r.data);

export const updateStatoOrdine = (id: string, stato: StatoOrdine) =>
  client
    .patch<Ordine>(`/ordini/${id}/stato`, null, { params: { stato } })
    .then((r) => r.data);

export const chiudiTavolo = (tavoloId: number) =>
  client.patch<Ordine[]>(`/ordini/tavoli/${tavoloId}/chiudi`).then((r) => r.data);
