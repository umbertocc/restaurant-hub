import { Link } from 'react-router-dom';
import { LEGAL_LAST_UPDATED_LABEL } from '../constants/legal';

export default function TerminiPage() {
  return (
    <main className="min-h-screen bg-[#fff8f0] px-6 py-12 text-[#2f241f] md:px-10">
      <div className="mx-auto w-full max-w-4xl rounded-3xl border border-[#efd6bc] bg-white p-8 shadow-sm md:p-10">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8f3a19]">Condizioni</p>
        <h1 className="mt-2 text-3xl font-bold text-[#2b1a13]">Termini di Servizio</h1>
        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#8f3a19]">Ultimo aggiornamento: {LEGAL_LAST_UPDATED_LABEL}</p>
        <p className="mt-4 text-sm leading-relaxed text-[#5f473c]">
          Questi termini regolano l'uso della piattaforma Restaurant Hub da parte del ristorante cliente.
        </p>

        <section className="mt-8 space-y-4 text-sm leading-relaxed text-[#5f473c]">
          <h2 className="text-lg font-semibold text-[#2f1d14]">1. Oggetto del servizio</h2>
          <p>
            Restaurant Hub fornisce funzionalita software per la gestione operativa del ristorante,
            incluse aree menu, ordini, tavoli, prenotazioni e ruoli operativi.
          </p>

          <h2 className="text-lg font-semibold text-[#2f1d14]">2. Account e responsabilita</h2>
          <p>
            Il cliente e responsabile delle credenziali di accesso e dell'uso corretto della piattaforma
            da parte dei propri operatori.
          </p>

          <h2 className="text-lg font-semibold text-[#2f1d14]">3. Trial e abbonamento</h2>
          <p>
            Il servizio puo prevedere un periodo di prova gratuito. Alla scadenza, alcune funzionalita
            possono essere limitate fino all'attivazione dell'abbonamento.
          </p>

          <h2 className="text-lg font-semibold text-[#2f1d14]">4. Limitazioni di responsabilita</h2>
          <p>
            Il servizio e fornito con continuita operativa ragionevole; restano esclusi i danni indiretti
            nei limiti consentiti dalla legge.
          </p>

          <h2 className="text-lg font-semibold text-[#2f1d14]">5. Supporto</h2>
          <p>
            Per supporto commerciale o tecnico: <a className="text-[#8f3a19] underline" href="mailto:info@restauranthub.it">info@restauranthub.it</a>.
          </p>
        </section>

        <div className="mt-10">
          <Link to="/landing" className="inline-flex rounded-xl border border-[#d2a57f] bg-[#fffaf4] px-5 py-2 text-sm font-semibold text-[#8f3a19] transition hover:bg-white">
            Torna alla landing
          </Link>
        </div>
      </div>
    </main>
  );
}
