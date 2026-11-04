import client from './client';
import { MenuCategoria, MenuItem } from '../types';

export type MenuItemPayload = Omit<MenuItem, 'id' | 'categoria'> & { categoriaId: number };
export type MenuCategoriaPayload = Omit<MenuCategoria, 'id' | 'ristoranteId'>;

export const getMenu = (ristoranteId: number) =>
  client.get<MenuItem[]>('/menu', { params: { ristoranteId } }).then((r) => r.data);

export const getMenuItem = (id: number) =>
  client.get<MenuItem>(`/menu/${id}`).then((r) => r.data);

export const getCategorieMenu = (ristoranteId: number) =>
  client.get<MenuCategoria[]>('/menu/categorie', { params: { ristoranteId } }).then((r) => r.data);

export const createCategoriaMenu = (data: MenuCategoriaPayload) =>
  client.post<MenuCategoria>('/menu/categorie', data).then((r) => r.data);

export const updateCategoriaMenu = (id: number, data: MenuCategoriaPayload) =>
  client.put<MenuCategoria>(`/menu/categorie/${id}`, data).then((r) => r.data);

export const deleteCategoriaMenu = (id: number) =>
  client.delete(`/menu/categorie/${id}`);

export const createMenuItem = ({ categoriaId, ...data }: MenuItemPayload) =>
  client.post<MenuItem>('/menu', { ...data, categoria: { id: categoriaId } }).then((r) => r.data);

export const updateMenuItem = (id: number, data: Partial<MenuItemPayload>) => {
  const { categoriaId, ...fields } = data;
  return client.put<MenuItem>(`/menu/${id}`, {
    ...fields,
    ...(categoriaId === undefined ? {} : { categoria: { id: categoriaId } }),
  }).then((r) => r.data);
};

export const deleteMenuItem = (id: number) =>
  client.delete(`/menu/${id}`);
