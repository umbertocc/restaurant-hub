import { Link } from 'react-router-dom';
import { LEGAL_LAST_UPDATED_LABEL } from '../constants/legal';

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#fff8f0] px-6 py-12 text-[#2f241f] md:px-10">
      <div className="mx-auto w-full max-w-4xl rounded-3xl border border-[#efd6bc] bg-white p-8 shadow-sm md:p-10">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8f3a19]">Informativa</p>
        <h1 className="mt-2 text-3xl font-bold text-[#2b1a13]">Privacy Policy</h1>
        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#8f3a19]">Ultimo aggiornamento: {LEGAL_LAST_UPDATED_LABEL}</p>
        <p className="mt-4 text-sm leading-relaxed text-[#5f473c]">
          Questa informativa descrive come Restaurant Hub raccoglie, usa e protegge i dati personali
          degli utenti che utilizzano la piattaforma.
        </p>

        <section className="mt-8 space-y-4 text-sm leading-relaxed text-[#5f473c]">
          <h2 className="text-lg font-semibold text-[#2f1d14]">1. Dati trattati</h2>
          <p>
            Trattiamo i dati necessari all'erogazione del servizio, come dati anagrafici del ristorante,
            contatti, dati di accesso e dati operativi relativi a ordini, tavoli e prenotazioni.
          </p>

          <h2 className="text-lg font-semibold text-[#2f1d14]">2. Finalita del trattamento</h2>
          <p>
            I dati sono utilizzati per fornire la piattaforma, migliorare il servizio, gestire la sicurezza,
            offrire assistenza e adempiere agli obblighi di legge.
          </p>

          <h2 className="text-lg font-semibold text-[#2f1d14]">3. Conservazione</h2>
          <p>
            I dati sono conservati per il tempo necessario alle finalita indicate e secondo i termini previsti
            dalla normativa applicabile.
          </p>

          <h2 className="text-lg font-semibold text-[#2f1d14]">4. Diritti dell'interessato</h2>
          <p>
            Puoi richiedere accesso, rettifica, cancellazione, limitazione o portabilita dei dati, nei limiti
            previsti dalla normativa vigente.
          </p>

          <h2 className="text-lg font-semibold text-[#2f1d14]">5. Contatti privacy</h2>
          <p>
            Per richieste privacy puoi scrivere a <a className="text-[#8f3a19] underline" href="mailto:info@restauranthub.it">info@restauranthub.it</a>.
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
