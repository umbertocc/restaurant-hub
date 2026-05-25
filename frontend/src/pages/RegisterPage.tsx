import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChefHat, ArrowLeft, CheckCircle, Eye, EyeOff, KeyRound } from 'lucide-react';
import { registerRistorante } from '../api/ristoranti';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nome: '',
    email: '',
    passwordHash: '',
    telefono: '',
    indirizzo: '',
    citta: '',
  });
  const [showPwd, setShowPwd] = useState(false);
  // Rimosso registrationCode: non più richiesto
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await registerRistorante(form); // Non serve più il codice
      setSuccess(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      setError(msg ?? 'Errore durante la registrazione. Riprova.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-red-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Registrazione completata!</h2>
            <p className="text-gray-500 text-sm mb-6">
              Il ristorante <strong>{form.nome}</strong> è stato registrato. Ora puoi accedere.
            </p>
            <button onClick={() => navigate('/login')} className="btn-primary w-full py-3">
              Vai al Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-red-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-600 rounded-2xl mb-4 shadow-lg">
            <ChefHat className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Restaurant Hub</h1>
          <p className="text-gray-400 mt-1">Crea il profilo del tuo ristorante</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Registra il tuo ristorante</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Nome ristorante *</label>
              <input
                className="input"
                placeholder="Es. La Trattoria del Borgo"
                value={form.nome}
                onChange={(e) => set('nome', e.target.value)}
                required
                autoFocus
              />
            </div>
            <div>
              <label className="label">Email *</label>
              <input
                type="email"
                className="input"
                placeholder="info@ristorante.it"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Telefono</label>
                <input
                  className="input"
                  placeholder="0612345678"
                  value={form.telefono}
                  onChange={(e) => set('telefono', e.target.value)}
                />
              </div>
              <div>
                <label className="label">Città</label>
                <input
                  className="input"
                  placeholder="Roma"
                  value={form.citta}
                  onChange={(e) => set('citta', e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="label">Password *</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="Minimo 8 caratteri"
                  value={form.passwordHash}
                  onChange={(e) => set('passwordHash', e.target.value)}
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  onClick={() => setShowPwd((v) => !v)}
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="label">Indirizzo</label>
              <input
                className="input"
                placeholder="Via Roma 1"
                value={form.indirizzo}
                onChange={(e) => set('indirizzo', e.target.value)}
              />
            </div>
            {/* Campo codice di registrazione rimosso */}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
              {loading ? 'Registrazione…' : 'Registra ristorante'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            <Link to="/login" className="inline-flex items-center gap-1 text-red-600 hover:underline font-medium">
              <ArrowLeft className="w-3 h-3" />
              Torna al login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
