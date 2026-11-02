import { useCallback, useEffect, useState } from 'react';
import { getDispositivi, impostaBloccoDispositivo } from '../api/dispositivi';
import { useAuth } from '../context/AuthContext';
import { Dispositivo } from '../types';

export default function DispositiviPage() {
  const { ristorante } = useAuth();
  const ristoranteId = ristorante?.id;
  const [dispositivi, setDispositivi] = useState<Dispositivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    if (!ristoranteId) return;
    setLoading(true);
    getDispositivi(ristoranteId)
      .then((d) => { setDispositivi(d); setError(''); })
      .catch((err) => setError(err.response?.data?.message || err.response?.data?.error || 'Impossibile caricare i dispositivi'))
      .finally(() => setLoading(false));
  }, [ristoranteId]);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async (d: Dispositivo) => {
    if (!ristoranteId) return;
    const blocca = !d.bloccatoAt;
    const testo = blocca
      ? `Bloccare "${d.nome}"? Il dispositivo non potra' piu' accedere.`
      : `Sbloccare "${d.nome}"?`;
    if (!window.confirm(testo)) return;
    try {
      await impostaBloccoDispositivo(ristoranteId, d.id, blocca);
      load();
    } catch {
      setError(blocca ? 'Impossibile bloccare il dispositivo' : 'Impossibile sbloccare il dispositivo');
    }
  };

  const formatData = (iso?: string | null) => (iso ? new Date(iso).toLocaleString('it-IT') : '-');

  const stato = (d: Dispositivo) => (d.revokedAt ? 'Revocato' : d.bloccatoAt ? 'Bloccato' : 'Attivo');

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Dispositivi</h1>
      <p className="text-sm text-gray-500 mb-6">
        Blocca un dispositivo smarrito: potrai sbloccarlo in qualsiasi momento.
      </p>
      {error && <div className="text-red-600 mb-4">{error}</div>}
      <table className="w-full border rounded-xl overflow-hidden bg-white text-sm">
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
          {!loading && dispositivi.length === 0 && (
            <tr><td colSpan={5} className="p-3 text-center text-gray-500">Nessun dispositivo registrato</td></tr>
          )}
          {dispositivi.map((d) => (
            <tr key={d.id} className="border-t">
              <td className="p-2">{d.nome}</td>
              <td className="p-2 capitalize">{d.ruolo}</td>
              <td className="p-2">{formatData(d.lastUsedAt)}</td>
              <td className="p-2">
                <span className={d.bloccatoAt || d.revokedAt ? 'text-red-600 font-medium' : 'text-green-700'}>{stato(d)}</span>
              </td>
              <td className="p-2 text-right">
                {!d.revokedAt && (
                  <button
                    className={d.bloccatoAt ? 'text-green-700 hover:underline' : 'text-red-600 hover:underline'}
                    onClick={() => handleToggle(d)}
                  >
                    {d.bloccatoAt ? 'Sblocca' : 'Blocca'}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
