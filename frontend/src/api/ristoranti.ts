// Restituisce la lista di tutti i ristoranti
export const getRistoranti = () =>
  client.get<Ristorante[]>('/ristoranti').then((r) => r.data);

// Approva un ristorante (PATCH /ristoranti/:id/approva)
export const approvaRistorante = (id: number) =>
  client.patch(`/ristoranti/${id}/approva`).then((r) => r.data);
import client from './client';
import { Ristorante, AuthResponse, LoginRequest } from '../types';

export const login = (data: LoginRequest) =>
  client.post<AuthResponse>('/auth/login', data).then((r) => r.data);

export const getRistorante = (id: number) =>
  client.get<Ristorante>(`/ristoranti/${id}`).then((r) => r.data);

export const registerRistorante = (data: Partial<Ristorante>, registrationCode: string) =>
  client.post<Ristorante>('/ristoranti', data, {
    headers: { 'X-Registration-Code': registrationCode },
  }).then((r) => r.data);

export const updateRistorante = (id: number, data: Partial<Ristorante>) =>
  client.put<Ristorante>(`/ristoranti/${id}`, data).then((r) => r.data);
