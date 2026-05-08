import { useState } from 'react';
import axios from 'axios';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await axios.post('/api/auth/forgot-password', { email });
      setSuccess('Se l’email esiste riceverai istruzioni per il reset.');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Errore durante la richiesta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <form className="card w-full max-w-sm p-6 space-y-4" onSubmit={handleSubmit}>
        <h2 className="text-xl font-bold mb-2">Password dimenticata</h2>
        <input
          type="email"
          className="input w-full"
          placeholder="La tua email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <button className="btn-primary w-full" type="submit" disabled={loading}>
          {loading ? 'Invio...' : 'Invia istruzioni'}
        </button>
        {success && <div className="text-green-600 text-sm">{success}</div>}
        {error && <div className="text-red-600 text-sm">{error}</div>}
      </form>
    </div>
  );
}
