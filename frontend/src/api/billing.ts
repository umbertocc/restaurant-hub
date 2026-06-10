import client from './client';

export interface BillingStatusResponse {
  subscriptionStatus?:
    | 'TRIAL_ACTIVE'
    | 'TRIAL_GRACE'
    | 'EXPIRED_TRIAL'
    | 'ACTIVE_PAID'
    | 'CANCELED';
  piano?: 'FREE' | 'PRO' | 'ENTERPRISE';
  trialStartAt?: string;
  trialEndAt?: string;
  trialGraceEndAt?: string;
  subscriptionCurrentPeriodEnd?: string;
  subscriptionCancelAtPeriodEnd?: boolean;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

export interface CheckoutSessionResponse {
  checkoutUrl: string;
  sessionId: string;
}

export interface CustomerPortalResponse {
  portalUrl: string;
}

export interface BillingInvoice {
  id: string;
  number: string;
  status: string;
  currency: string;
  amountPaid: number;
  periodStart?: number;
  periodEnd?: number;
  hostedInvoiceUrl?: string;
  invoicePdf?: string;
  created?: number;
}

export async function getBillingStatus(): Promise<BillingStatusResponse> {
  const { data } = await client.get<BillingStatusResponse>('/billing/status');
  return data;
}

export async function createCheckoutSession(piano: 'PRO' | 'ENTERPRISE'): Promise<CheckoutSessionResponse> {
  const { data } = await client.post<CheckoutSessionResponse>('/billing/checkout-session', { piano });
  return data;
}

export async function createCustomerPortalSession(): Promise<CustomerPortalResponse> {
  const { data } = await client.post<CustomerPortalResponse>('/billing/customer-portal-session');
  return data;
}

export async function cancelSubscription(immediate = false): Promise<BillingStatusResponse> {
  const { data } = await client.post<BillingStatusResponse>('/billing/cancel', { immediate });
  return data;
}

export async function reactivateSubscription(): Promise<BillingStatusResponse> {
  const { data } = await client.post<BillingStatusResponse>('/billing/reactivate');
  return data;
}

export async function getBillingInvoices(limit = 8): Promise<BillingInvoice[]> {
  const { data } = await client.get<BillingInvoice[]>('/billing/invoices', { params: { limit } });
  return data;
}
