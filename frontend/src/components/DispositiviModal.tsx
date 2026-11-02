import { useCallback, useEffect, useState, FormEvent } from 'react';
import { Copy, Plus, X } from 'lucide-react';
import {
  creaDispositivo,
  getDispositivi,
  impostaBloccoDispositivo,
  revocaDispositivo,
  rigeneraCodice,
} from '../api/dispositivi';
import { Dispositivo, RuoloDispositivo } from '../types';

const RUOLI: { value: RuoloDispositivo; label: string }[] = [
  { value: 'cameriere', label: 'Cameriere' },
  { value: 'cuoco', label: 'Cuoco' },
  { value: 'barista', label: 'Barista' },
  { value: 'pizzaiolo', label: 'Pizzaiolo' },
  { value: 'admin', label: 'Admin' },
];

interface Props {
  ristoranteId: number;
  ristoranteNome: string;
  onClose: () => void;
}

export default function DispositiviModal({ ristoranteId, ristoranteNome, onClose }: Props) {
  const [dispositivi, setDispositivi] = useState<Dispositivo[]>([]);
  const [nome, setNome] = useState('');
  const [ruolo, setRuolo] = useState<RuoloDispositivo>('cameriere');
  const [nuovo, setNuovo] = useState<Dispositivo | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    getDispositivi(ristoranteId)
      .then(setDispositivi)
      .catch(() => setError('Errore nel caricamento dei dispositivi'));
  }, [ristoranteId]);

  useEffect(() => { load(); }, [load]);

  const handleCrea = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const creato = await creaDispositivo(ristoranteId, { nome: nome.trim(), ruolo });
      setNuovo(creato);
      setNome('');
      load();
    } catch {
      setError('Impossibile creare il dispositivo');
    } finally {
      setSaving(false);
    }
  };

  const handleRevoca = async (d: Dispositivo) => {
    if (!window.confirm(`Revocare il codice di "${d.nome}"? Il dispositivo non potra' piu' attivarsi.`)) return;
    try {
      await revocaDispositivo(ristoranteId, d.id);
      load();
    } catch {
      setError('Impossibile revocare il dispositivo');
    }
  };

  const handleRigenera = async (d: Dispositivo) => {
    if (!window.confirm(`Rigenerare il codice di "${d.nome}"? Il vecchio codice smettera' di funzionare.`)) return;
    try {
      setNuovo(await rigeneraCodice(ristoranteId, d.id));
      load();
    } catch {
      setError('Impossibile rigenerare il codice');
    }
  };

  const handleBlocco = async (d: Dispositivo) => {
    try {
      await impostaBloccoDispositivo(ristoranteId, d.id, !d.bloccatoAt);
      load();
    } catch {
      setError('Impossibile aggiornare il blocco del dispositivo');
    }
  };

  const formatData = (iso?: string | null) => (iso ? new Date(iso).toLocaleString('it-IT') : '-');

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold">Dispositivi</h2>
            <p className="text-sm text-gray-500">{ristoranteNome}</p>
          </div>
          <button onClick={onClose} className="p-1 text-gray-500 hover:text-gray-800" aria-label="Chiudi">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && <div className="text-red-600 mb-3 text-sm">{error}</div>}

        {nuovo?.codice && (
          <div className="mb-4 rounded-xl border border-emerald-300 bg-emerald-50 p-4">
            <p className="text-sm text-emerald-900 mb-2">
              Codice per <strong>{nuovo.nome}</strong> ({nuovo.ruolo}). Copialo ora: non sara' piu' visibile.
            </p>
            <div className="flex items-center gap-3">
              <code className="text-2xl font-mono font-bold tracking-wider">{nuovo.codice}</code>
              <button
                className="p-2 rounded-lg bg-white border hover:bg-gray-50"
                onClick={() => navigator.clipboard?.writeText(nuovo.codice ?? '')}
                aria-label="Copia codice"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button className="text-sm text-gray-600 underline" onClick={() => setNuovo(null)}>
                Nascondi
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleCrea} className="flex flex-wrap gap-2 mb-5">
          <input
            className="input flex-1 min-w-[160px]"
            placeholder="Nome (es. Tablet sala)"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            maxLength={100}
            required
          />
          <select className="input w-40" value={ruolo} onChange={(e) => setRuolo(e.target.value as RuoloDispositivo)}>
            {RUOLI.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          <button type="submit" disabled={saving || !nome.trim()} className="btn-primary flex items-center gap-1">
            <Plus className="w-4 h-4" /> Genera codice
          </button>
        </form>

        <table className="w-full text-sm border rounded-xl overflow-hidden">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-2">Nome</th>
              <th className="p-2">Ruolo</th>
              <th className="p-2">Ultimo uso</th>
              <th className="p-2">Stato</th>
              <th className="p-2" />
            </tr>
          </thead>
          <tbody>
            {dispositivi.length === 0 && (
              <tr><td colSpan={5} className="p-3 text-center text-gray-500">Nessun dispositivo registrato</td></tr>
            )}
            {dispositivi.map((d) => (
              <tr key={d.id} className="border-t">
                <td className="p-2">{d.nome}</td>
                <td className="p-2 capitalize">{d.ruolo}</td>
                <td className="p-2">{formatData(d.lastUsedAt)}</td>
                <td className="p-2">
                  {d.revokedAt ? 'Revocato' : d.bloccatoAt ? (
                    <span className="text-red-600 font-medium">Bloccato</span>
                  ) : 'Attivo'}
                </td>
                <td className="p-2 text-right whitespace-nowrap">
                  {!d.revokedAt && (
                    <>
                      <button className="text-gray-700 hover:underline mr-3" onClick={() => handleBlocco(d)}>
                        {d.bloccatoAt ? 'Sblocca' : 'Blocca'}
                      </button>
                      <button className="text-blue-600 hover:underline mr-3" onClick={() => handleRigenera(d)}>
                        Rigenera codice
                      </button>
                      <button className="text-red-600 hover:underline" onClick={() => handleRevoca(d)}>
                        Revoca
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
