import { Ordine } from '../types';

// Un tavolo resta occupato finché ha ordini non ancora pagati né annullati (seduta corrente).
export function getOrdiniOccupantiTavolo(ordini: Ordine[]): Ordine[] {
  return ordini.filter((ordine) => ordine.stato !== 'PAGATO' && ordine.stato !== 'ANNULLATO');
}

// Ordine modificabile più recente; se tutti sono consegnati (CHIUSO) restituisce l'ultimo.
export function getOrdinePrincipaleTavolo(ordini: Ordine[], tavoloId: number): Ordine | undefined {
  const seduta = getOrdiniSedutaTavolo(ordini, tavoloId);
  return [...seduta].reverse().find((o) => o.stato !== 'CHIUSO') ?? seduta[seduta.length - 1];
}

export function getOrdiniSedutaTavolo(ordini: Ordine[], tavoloId: number): Ordine[] {
  return getOrdiniOccupantiTavolo(ordini)
    .filter((ordine) => ordine.tavoloId === tavoloId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}
