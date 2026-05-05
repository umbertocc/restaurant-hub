import client from './client';
import { MenuItem } from '../types';

export const getMenu = (ristoranteId: number) =>
  client.get<MenuItem[]>('/menu', { params: { ristoranteId } }).then((r) => r.data);

export const getMenuItem = (id: number) =>
  client.get<MenuItem>(`/menu/${id}`).then((r) => r.data);

export const createMenuItem = (data: Omit<MenuItem, 'id'>) =>
  client.post<MenuItem>('/menu', data).then((r) => r.data);

export const updateMenuItem = (id: number, data: Partial<MenuItem>) =>
  client.put<MenuItem>(`/menu/${id}`, data).then((r) => r.data);

export const deleteMenuItem = (id: number) =>
  client.delete(`/menu/${id}`);
