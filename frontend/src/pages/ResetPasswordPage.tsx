import { useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';

export default function ResetPasswordPage() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token') || '';
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await client.post('/auth/reset-password', { token, newPassword });
      setSuccess('Password aggiornata con successo! Ora puoi accedere.');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Errore durante il reset.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return <div className="text-center mt-10 text-red-600">Token non valido.</div>;
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="card w-full max-w-sm p-6 space-y-4 text-center">
          <h2 className="text-xl font-bold mb-2">Password aggiornata</h2>
          <div className="text-green-600 text-sm">{success}</div>
          <Link className="btn-primary w-full inline-block" to="/login">
            Torna al login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <form className="card w-full max-w-sm p-6 space-y-4" onSubmit={handleSubmit}>
        <h2 className="text-xl font-bold mb-2">Imposta nuova password</h2>
        <input
          type="password"
          className="input w-full"
          placeholder="Nuova password (min 8 caratteri)"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          minLength={8}
          required
        />
        <button className="btn-primary w-full" type="submit" disabled={loading}>
          {loading ? 'Salvataggio...' : 'Salva nuova password'}
        </button>
        {error && <div className="text-red-600 text-sm">{error}</div>}
      </form>
    </div>
  );
}
