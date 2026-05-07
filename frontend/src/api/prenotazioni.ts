import client from './client';
import { Prenotazione, PrenotazioneDTO, StatoPrenotazione } from '../types';

export const getPrenotazioni = () =>
  client
    .get<Prenotazione[]>('/prenotazioni')
    .then((r) => r.data);

export const getPrenotazione = (id: string) =>
  client.get<Prenotazione>(`/prenotazioni/${id}`).then((r) => r.data);

export const createPrenotazione = (data: PrenotazioneDTO) =>
  client.post<Prenotazione>('/prenotazioni', data).then((r) => r.data);

export const updateStatoPrenotazione = (id: string, stato: StatoPrenotazione) =>
  client
    .patch<Prenotazione>(`/prenotazioni/${id}/stato`, null, { params: { stato } })
    .then((r) => r.data);

export const deletePrenotazione = (id: string) =>
  client.delete(`/prenotazioni/${id}`);
