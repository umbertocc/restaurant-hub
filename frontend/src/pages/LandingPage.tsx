import { Link } from 'react-router-dom';

const highlights = [
  {
    title: 'Tutto il servizio in un solo flusso',
    description:
      'Cucina, sala, bar e pizzeria lavorano insieme in tempo reale. Meno errori, più tavoli serviti bene.',
  },
  {
    title: 'Menu digitale direttamente sui tavoli',
    description:
      'Ogni tavolo puo avere il suo menu digitale con QR code: i clienti consultano piatti, prezzi e allergeni in autonomia.',
  },
  {
    title: 'Prenotazioni smart e tavoli sempre sotto controllo',
    description:
      'Gestisci disponibilita, turni e capienza con una vista chiara, pensata per le ore di punta.',
  },
  {
    title: 'Dashboard operativa per chi decide',
    description:
      'Ordini, tempi medi e colli di bottiglia in evidenza per prendere decisioni veloci durante il servizio.',
  },
];

const stats = [
  { value: '35%', label: 'tempi morti ridotti nei momenti critici' },
  { value: '2x', label: 'piu velocita nel passaggio sala-cucina' },
  { value: '24/7', label: 'monitoraggio operativo multi-ruolo' },
];

export default function LandingPage() {
  return (
    <main className="landing-root min-h-screen overflow-x-hidden bg-[#fff8f0] text-[#2f241f]">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="landing-blob animate-drift h-72 w-72 bg-[#ffb36a]/50 top-[-5rem] left-[-4rem]" />
        <div className="landing-blob animate-drift-delay h-96 w-96 bg-[#ff7f50]/40 top-[18rem] right-[-8rem]" />
        <div className="landing-blob animate-drift h-64 w-64 bg-[#ffd79a]/60 bottom-[-4rem] left-[25%]" />
      </div>

      <section className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 pb-16 pt-12 md:px-10 lg:flex-row lg:items-center lg:pt-20">
        <div className="max-w-2xl animate-rise">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#e3b27d] bg-[#fff1df] px-4 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#9f4b1e]">
            Restaurant Hub
          </p>
          <h1 className="landing-display text-4xl leading-tight text-[#231711] sm:text-5xl md:text-6xl">
            La regia digitale per ristoranti che non si fermano mai.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-[#5a443a]">
            Dalla comanda al tavolo, coordina ogni reparto con una piattaforma unica e imposta anche il menu digitale ai tavoli. Piu ritmo nel servizio, meno stress nel team.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/registrati"
              className="rounded-xl bg-[#d54f1a] px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:-translate-y-0.5 hover:bg-[#b54013]"
            >
              Inizia ora
            </Link>
            <Link
              to="/login"
              className="rounded-xl border border-[#d2a57f] bg-[#fffaf4] px-6 py-3 text-sm font-semibold uppercase tracking-wide text-[#8f3a19] transition hover:-translate-y-0.5 hover:bg-white"
            >
              Accedi alla piattaforma
            </Link>
          </div>
          <p className="mt-3 text-sm font-semibold text-[#8f3a19]">30 giorni gratis, senza impegno.</p>
        </div>

        <div className="w-full max-w-xl animate-rise-delay">
          <div className="grid gap-4 rounded-3xl border border-[#f2d0af] bg-white/80 p-5 shadow-[0_20px_80px_-35px_rgba(132,53,15,0.55)] backdrop-blur sm:grid-cols-2">
            <div className="rounded-2xl bg-[#fff3e4] p-4 sm:col-span-2">
              <p className="text-xs uppercase tracking-[0.14em] text-[#9f4b1e]">Flusso ordini live</p>
              <p className="landing-display mt-2 text-2xl text-[#2a1a13]">Sala -&gt; Cucina -&gt; Consegna</p>
            </div>
            <div className="rounded-2xl border border-[#f3d8bd] bg-white p-4">
              <p className="text-sm font-semibold text-[#8a3f20]">Cucina</p>
              <p className="mt-2 text-sm text-[#60463b]">Priorita chiare e stato ordini in tempo reale.</p>
            </div>
            <div className="rounded-2xl border border-[#f3d8bd] bg-white p-4">
              <p className="text-sm font-semibold text-[#8a3f20]">Sala</p>
              <p className="mt-2 text-sm text-[#60463b]">Aggiornamenti immediati su tempi e consegne.</p>
            </div>
            <div className="rounded-2xl border border-[#f3d8bd] bg-white p-4">
              <p className="text-sm font-semibold text-[#8a3f20]">Bar/Pizzeria</p>
              <p className="mt-2 text-sm text-[#60463b]">Code ordinate per ridurre i tempi di attesa.</p>
            </div>
            <div className="rounded-2xl border border-[#f3d8bd] bg-white p-4">
              <p className="text-sm font-semibold text-[#8a3f20]">Manager</p>
              <p className="mt-2 text-sm text-[#60463b]">Visione completa su operativita e performance.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 pb-14 md:px-10">
        <div className="grid gap-4 md:grid-cols-3">
          {stats.map((item) => (
            <article key={item.label} className="rounded-2xl border border-[#f0d4b8] bg-white/80 p-5">
              <p className="landing-display text-3xl text-[#8f3510]">{item.value}</p>
              <p className="mt-2 text-sm text-[#65493d]">{item.label}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-4 px-6 pb-16 md:grid-cols-2 lg:grid-cols-4 md:px-10">
        {highlights.map((item) => (
          <article key={item.title} className="rounded-2xl border border-[#efcfb2] bg-[#fffdfa] p-6">
            <h2 className="landing-display text-2xl text-[#2b1b14]">{item.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-[#5f473c]">{item.description}</p>
          </article>
        ))}
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 pb-20 md:px-10">
        <div className="rounded-3xl border border-[#efc8a0] bg-[#ffe6cc] p-8 text-center shadow-[0_18px_60px_-40px_rgba(125,48,10,0.9)] md:p-12">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8f3a19]">Pronto a partire</p>
          <h2 className="landing-display mt-3 text-3xl text-[#311f17] md:text-4xl">
            Trasforma il tuo servizio in un’esperienza coordinata.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-[#5f4438] md:text-base">
            Porta il tuo team su una piattaforma pensata per il ritmo vero della ristorazione.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/registrati"
              className="rounded-xl bg-[#b84014] px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-[#9d3610]"
            >
              Crea account
            </Link>
            <Link
              to="/login"
              className="rounded-xl border border-[#bf6a3f] bg-white px-6 py-3 text-sm font-semibold uppercase tracking-wide text-[#8a3515] transition hover:bg-[#fff7f1]"
            >
              Accedi
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
