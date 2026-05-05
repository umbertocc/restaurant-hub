import client from './client';
import { Tavolo } from '../types';

export const getTavoli = (ristoranteId: number) =>
  client.get<Tavolo[]>(`/tavoli?ristoranteId=${ristoranteId}`).then((r) => r.data);

export const createTavolo = (data: Partial<Tavolo>) =>
  client.post<Tavolo>('/tavoli', data).then((r) => r.data);

export const updateTavolo = (id: number, data: Partial<Tavolo>) =>
  client.put<Tavolo>(`/tavoli/${id}`, data).then((r) => r.data);

export const deleteTavolo = (id: number) =>
  client.delete(`/tavoli/${id}`);
