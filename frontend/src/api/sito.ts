import client from './client';
import { SitoConfig, PublicSito } from '../types';

export const getSitoConfig = () =>
  client.get<SitoConfig>('/sito').then((r) => r.data);

export const updateSitoConfig = (data: SitoConfig) =>
  client.put<SitoConfig>('/sito', data).then((r) => r.data);

export const getSitoPubblico = (slug: string) =>
  client.get<PublicSito>(`/public/sito/${encodeURIComponent(slug)}`).then((r) => r.data);
