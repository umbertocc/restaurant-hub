import { useEffect, useMemo, useState } from 'react';
import {
  createCheckoutSession,
  getBillingStatus,
  BillingStatusResponse,
  createCustomerPortalSession,
  cancelSubscription,
  reactivateSubscription,
  getBillingInvoices,
  BillingInvoice,
} from '../api/billing';
import { useAuth } from '../context/AuthContext';
import { useSearchParams } from 'react-router-dom';

const fmt = (value?: string) => {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export default function BillingPage() {
  const [searchParams] = useSearchParams();
  const { refreshRistorante, ristorante } = useAuth();
  const [status, setStatus] = useState<BillingStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState<'PRO' | 'ENTERPRISE' | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [reactivateLoading, setReactivateLoading] = useState(false);
  const [invoices, setInvoices] = useState<BillingInvoice[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getBillingStatus();
      setStatus(data);
      setInvoicesLoading(true);
      const invoiceRows = await getBillingInvoices(8);
      setInvoices(invoiceRows);
      if (ristorante) {
        refreshRistorante({
          ...ristorante,
          piano: (data.piano ?? ristorante.piano),
          subscriptionStatus: data.subscriptionStatus ?? ristorante.subscriptionStatus,
          subscriptionCurrentPeriodEnd: data.subscriptionCurrentPeriodEnd,
          stripeSubscriptionId: data.stripeSubscriptionId,
          stripeCustomerId: data.stripeCustomerId,
          trialGraceEndAt: data.trialGraceEndAt,
          subscriptionCancelAtPeriodEnd: data.subscriptionCancelAtPeriodEnd,
        });
      }
    } catch (e: any) {
      const msg = e?.customMessage || e?.response?.data?.message || 'Errore caricamento stato abbonamento';
      setError(msg);
    } finally {
      setInvoicesLoading(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    const checkout = searchParams.get('checkout');
    if (checkout === 'success') {
      setInfo('Pagamento completato. Lo stato abbonamento verra aggiornato a breve.');
      void load();
    } else if (checkout === 'cancel') {
      setInfo('Pagamento annullato. Nessun addebito effettuato.');
    }
  }, [searchParams]);

  const canActivate = useMemo(() => {
    return status?.subscriptionStatus !== 'ACTIVE_PAID';
  }, [status?.subscriptionStatus]);

  const startCheckout = async (piano: 'PRO' | 'ENTERPRISE') => {
    try {
      setCheckoutLoading(piano);
      setError(null);
      const session = await createCheckoutSession(piano);
      window.location.href = session.checkoutUrl;
    } catch (e: any) {
      const msg = e?.customMessage || e?.response?.data?.message || 'Impossibile avviare il pagamento';
      setError(msg);
      setCheckoutLoading(null);
    }
  };

  const openCustomerPortal = async () => {
    try {
      setPortalLoading(true);
      setError(null);
      const result = await createCustomerPortalSession();
      window.location.href = result.portalUrl;
    } catch (e: any) {
      const msg = e?.customMessage || e?.response?.data?.message || 'Impossibile aprire il portale pagamenti';
      setError(msg);
      setPortalLoading(false);
    }
  };

  const requestCancelSubscription = async () => {
    const confirmed = window.confirm('Confermi l annullamento dell abbonamento a fine periodo?');
    if (!confirmed) return;

    try {
      setCancelLoading(true);
      setError(null);
      const nextStatus = await cancelSubscription(false);
      setStatus(nextStatus);
      setInfo('Abbonamento impostato per annullamento a fine periodo corrente.');
      if (ristorante) {
        refreshRistorante({
          ...ristorante,
          subscriptionStatus: nextStatus.subscriptionStatus ?? ristorante.subscriptionStatus,
          subscriptionCurrentPeriodEnd: nextStatus.subscriptionCurrentPeriodEnd,
          subscriptionCancelAtPeriodEnd: nextStatus.subscriptionCancelAtPeriodEnd,
          stripeSubscriptionId: nextStatus.stripeSubscriptionId,
        });
      }
    } catch (e: any) {
      const msg = e?.customMessage || e?.response?.data?.message || 'Impossibile annullare l abbonamento';
      setError(msg);
    } finally {
      setCancelLoading(false);
    }
  };

  const requestReactivateSubscription = async () => {
    try {
      setReactivateLoading(true);
      setError(null);
      const nextStatus = await reactivateSubscription();
      setStatus(nextStatus);
      setInfo('Abbonamento riattivato con successo.');
      if (ristorante) {
        refreshRistorante({
          ...ristorante,
          subscriptionStatus: nextStatus.subscriptionStatus ?? ristorante.subscriptionStatus,
          subscriptionCurrentPeriodEnd: nextStatus.subscriptionCurrentPeriodEnd,
          subscriptionCancelAtPeriodEnd: nextStatus.subscriptionCancelAtPeriodEnd,
          stripeSubscriptionId: nextStatus.stripeSubscriptionId,
        });
      }
    } catch (e: any) {
      const msg = e?.customMessage || e?.response?.data?.message || 'Impossibile riattivare l abbonamento';
      setError(msg);
    } finally {
      setReactivateLoading(false);
    }
  };

  const fmtAmount = (amountInCents: number, currency: string) => {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: currency || 'EUR' }).format((amountInCents || 0) / 100);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Abbonamento</h1>
        <p className="text-sm text-gray-600 mt-1">
          Gestisci piano, trial e pagamento del tuo account.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}
      {info && (
        <div className="rounded-xl border border-blue-300 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          {info}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="text-xs uppercase tracking-wider text-gray-500">Stato attuale</p>
          {loading ? (
            <p className="mt-2 text-sm text-gray-500">Caricamento...</p>
          ) : (
            <>
              <p className="mt-2 text-lg font-semibold text-gray-900">{status?.subscriptionStatus ?? 'N/D'}</p>
              <p className="mt-1 text-sm text-gray-600">Piano: {status?.piano ?? 'FREE'}</p>
              <p className="mt-1 text-sm text-gray-600">Fine trial: {fmt(status?.trialEndAt)}</p>
              <p className="mt-1 text-sm text-gray-600">Fine periodo corrente: {fmt(status?.subscriptionCurrentPeriodEnd)}</p>
              <p className="mt-1 text-sm text-gray-600">
                Disdetta programmata: {status?.subscriptionCancelAtPeriodEnd ? 'SI' : 'NO'}
              </p>
            </>
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="text-xs uppercase tracking-wider text-gray-500">Azioni</p>
          <div className="mt-3 flex flex-col gap-3">
            <button
              onClick={() => startCheckout('PRO')}
              disabled={!canActivate || checkoutLoading !== null}
              className="rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {checkoutLoading === 'PRO' ? 'Reindirizzamento...' : 'Attiva PRO (mensile)'}
            </button>
            <button
              onClick={() => startCheckout('ENTERPRISE')}
              disabled={!canActivate || checkoutLoading !== null}
              className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-red-300"
            >
              {checkoutLoading === 'ENTERPRISE' ? 'Reindirizzamento...' : 'Attiva ENTERPRISE (mensile)'}
            </button>
            <button
              onClick={() => void load()}
              className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Aggiorna stato pagamento
            </button>
            <button
              onClick={openCustomerPortal}
              disabled={portalLoading || !status?.stripeCustomerId}
              className="rounded-xl border border-indigo-300 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {portalLoading ? 'Apertura portale...' : 'Gestisci pagamenti (Portale Stripe)'}
            </button>
            <button
              onClick={requestCancelSubscription}
              disabled={cancelLoading || status?.subscriptionStatus !== 'ACTIVE_PAID' || status?.subscriptionCancelAtPeriodEnd === true}
              className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {cancelLoading ? 'Annullamento in corso...' : 'Annulla abbonamento a fine periodo'}
            </button>
            <button
              onClick={requestReactivateSubscription}
              disabled={reactivateLoading || status?.subscriptionCancelAtPeriodEnd !== true}
              className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {reactivateLoading ? 'Riattivazione in corso...' : 'Riattiva abbonamento'}
            </button>
          </div>
          {!canActivate && (
            <p className="mt-3 text-xs text-emerald-700">
              Il tuo abbonamento è attivo. Non serve attivare un nuovo piano.
            </p>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs uppercase tracking-wider text-gray-500">Fatture recenti</p>
          <button
            onClick={() => void load()}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            Aggiorna fatture
          </button>
        </div>

        {invoicesLoading ? (
          <p className="mt-3 text-sm text-gray-500">Caricamento fatture...</p>
        ) : invoices.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">Nessuna fattura disponibile.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-2 pr-3">Numero</th>
                  <th className="py-2 pr-3">Data</th>
                  <th className="py-2 pr-3">Periodo</th>
                  <th className="py-2 pr-3">Importo</th>
                  <th className="py-2 pr-3">Stato</th>
                  <th className="py-2">Documento</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-gray-100 text-gray-700">
                    <td className="py-2 pr-3">{invoice.number || invoice.id}</td>
                    <td className="py-2 pr-3">{fmt(invoice.created ? new Date(invoice.created * 1000).toISOString() : undefined)}</td>
                    <td className="py-2 pr-3">
                      {fmt(invoice.periodStart ? new Date(invoice.periodStart * 1000).toISOString() : undefined)} - {fmt(invoice.periodEnd ? new Date(invoice.periodEnd * 1000).toISOString() : undefined)}
                    </td>
                    <td className="py-2 pr-3">{fmtAmount(invoice.amountPaid, invoice.currency)}</td>
                    <td className="py-2 pr-3 uppercase">{invoice.status}</td>
                    <td className="py-2">
                      {invoice.hostedInvoiceUrl ? (
                        <a
                          href={invoice.hostedInvoiceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-700 hover:underline"
                        >
                          Apri
                        </a>
                      ) : invoice.invoicePdf ? (
                        <a
                          href={invoice.invoicePdf}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-700 hover:underline"
                        >
                          PDF
                        </a>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
