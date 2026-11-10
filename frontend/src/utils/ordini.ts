import { Ordine } from '../types';

export function getOrdiniOccupantiTavolo(ordini: Ordine[]): Ordine[] {
  const ultimoOrdinePerTavolo = new Map<number, Ordine>();

  for (const ordine of ordini) {
    const precedente = ultimoOrdinePerTavolo.get(ordine.tavoloId);
    const dataOrdine = Date.parse(ordine.createdAt);
    const dataPrecedente = precedente ? Date.parse(precedente.createdAt) : Number.NaN;

    if (!precedente
      || (Number.isFinite(dataOrdine)
        && (!Number.isFinite(dataPrecedente) || dataOrdine >= dataPrecedente))) {
      ultimoOrdinePerTavolo.set(ordine.tavoloId, ordine);
    }
  }

  return Array.from(ultimoOrdinePerTavolo.values()).filter(
    (ordine) => ordine.stato === 'APERTO'
      || ordine.stato === 'IN_PREPARAZIONE'
      || ordine.stato === 'SERVITO'
      || ordine.stato === 'CHIUSO',
  );
}
