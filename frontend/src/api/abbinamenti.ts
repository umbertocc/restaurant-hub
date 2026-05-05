import client from './client';
import { Abbinamento, MenuItem, TipoAbbinamento } from '../types';

export const getAbbinamenti = (piattoId: number, tipo?: TipoAbbinamento) =>
  client
    .get<Abbinamento[]>('/abbinamenti', { params: { piattoId, tipo } })
    .then((r) => r.data);

export const getSuggerimenti = (piattoId: number) =>
  client
    .get<MenuItem[]>(`/abbinamenti/${piattoId}/suggerimenti`)
    .then((r) => r.data);

export const createAbbinamento = (data: Omit<Abbinamento, 'id'>) =>
  client.post<Abbinamento>('/abbinamenti', data).then((r) => r.data);

export const deleteAbbinamento = (id: number) =>
  client.delete(`/abbinamenti/${id}`);
