import { useEffect, useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { getRistoranti, approvaRistorante } from '../api/ristoranti';

interface Ristorante {
  id: number;
  nome: string;
  email: string;
  attivo: boolean;
  citta?: string;
  telefono?: string;
}

export default function AdminRistorantiPage() {
  const [ristoranti, setRistoranti] = useState<Ristorante[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    getRistoranti()
      .then(setRistoranti)
      .catch(() => setError('Errore nel caricamento'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleApprova = async (id: number) => {
    try {
      await approvaRistorante(id);
      load();
    } catch {
      setError('Errore durante l\'approvazione');
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Gestione Ristoranti</h1>
      {error && <div className="text-red-600 mb-4">{error}</div>}
      <table className="w-full border rounded-xl overflow-hidden bg-white">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 text-left">Nome</th>
            <th className="p-2 text-left">Email</th>
            <th className="p-2 text-left">Città</th>
            <th className="p-2 text-left">Telefono</th>
            <th className="p-2 text-center">Attivo</th>
            <th className="p-2 text-center">Azione</th>
          </tr>
        </thead>
        <tbody>
          {ristoranti.map(r => (
            <tr key={r.id} className="border-t">
              <td className="p-2">{r.nome}</td>
              <td className="p-2">{r.email}</td>
              <td className="p-2">{r.citta ?? '-'}</td>
              <td className="p-2">{r.telefono ?? '-'}</td>
              <td className="p-2 text-center">
                {r.attivo ? <CheckCircle className="inline w-5 h-5 text-green-600" /> : <XCircle className="inline w-5 h-5 text-red-500" />}
              </td>
              <td className="p-2 text-center">
                {!r.attivo && (
                  <button
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
                    onClick={() => handleApprova(r.id)}
                  >
                    Approva
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
