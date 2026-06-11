package com.example.restaurant.service;

import com.example.restaurant.model.Ristorante;
import com.example.restaurant.repository.RistoranteRepository;
import com.stripe.Stripe;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.Customer;
import com.stripe.model.Event;
import com.stripe.model.EventDataObjectDeserializer;
import com.stripe.model.Invoice;
import com.stripe.model.StripeObject;
import com.stripe.model.Subscription;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import com.stripe.param.CustomerCreateParams;
import com.stripe.param.InvoiceListParams;
import com.stripe.param.SubscriptionUpdateParams;
import com.stripe.param.SubscriptionRetrieveParams;
import com.stripe.param.checkout.SessionCreateParams;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class BillingService {

    private final RistoranteRepository ristoranteRepository;

    @Value("${app.billing.stripe.secret-key:}")
    private String stripeSecretKey;

    @Value("${app.billing.stripe.webhook-secret:}")
    private String stripeWebhookSecret;

    @Value("${app.billing.stripe.price-pro-monthly:}")
    private String proMonthlyPriceId;

    @Value("${app.billing.stripe.price-enterprise-monthly:}")
    private String enterpriseMonthlyPriceId;

    @Value("${app.billing.success-url}")
    private String successUrl;

    @Value("${app.billing.cancel-url}")
    private String cancelUrl;

    @Value("${app.billing.portal-return-url}")
    private String portalReturnUrl;

    public BillingService(RistoranteRepository ristoranteRepository) {
        this.ristoranteRepository = ristoranteRepository;
    }

    public Map<String, Object> createCheckoutSession(Ristorante ristorante, String piano) {
        ensureStripeConfigured();
        Stripe.apiKey = stripeSecretKey;

        String normalizedPiano = piano == null ? "" : piano.trim().toUpperCase();
        String priceId = switch (normalizedPiano) {
            case "PRO" -> proMonthlyPriceId;
            case "ENTERPRISE" -> enterpriseMonthlyPriceId;
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Piano non supportato");
        };

        if (priceId == null || priceId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Prezzo Stripe non configurato per il piano selezionato");
        }

        try {
            String customerId = ensureStripeCustomer(ristorante);

            SessionCreateParams params = SessionCreateParams.builder()
                    .setMode(SessionCreateParams.Mode.SUBSCRIPTION)
                    .setCustomer(customerId)
                    .setSuccessUrl(successUrl)
                    .setCancelUrl(cancelUrl)
                    .setClientReferenceId(String.valueOf(ristorante.getId()))
                    .putMetadata("ristoranteId", String.valueOf(ristorante.getId()))
                    .putMetadata("piano", normalizedPiano)
                    .addLineItem(SessionCreateParams.LineItem.builder()
                            .setPrice(priceId)
                            .setQuantity(1L)
                            .build())
                    .build();

            Session session = Session.create(params);
            return Map.of(
                    "checkoutUrl", session.getUrl(),
                    "sessionId", session.getId()
            );
        } catch (StripeException e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Errore durante la creazione del checkout Stripe", e);
        }
    }

    public Map<String, Object> getBillingStatus(Ristorante ristorante) {
        Map<String, Object> status = new LinkedHashMap<>();
        status.put("subscriptionStatus", ristorante.getSubscriptionStatus());
        status.put("piano", ristorante.getPiano());
        status.put("trialStartAt", ristorante.getTrialStartAt());
        status.put("trialEndAt", ristorante.getTrialEndAt());
        status.put("trialGraceEndAt", ristorante.getTrialGraceEndAt());
        status.put("subscriptionCurrentPeriodEnd", ristorante.getSubscriptionCurrentPeriodEnd());
        status.put("subscriptionCancelAtPeriodEnd", Boolean.TRUE.equals(ristorante.getSubscriptionCancelAtPeriodEnd()));
        status.put("stripeCustomerId", ristorante.getStripeCustomerId());
        status.put("stripeSubscriptionId", ristorante.getStripeSubscriptionId());
        return status;
    }

    public Map<String, Object> createCustomerPortalSession(Ristorante ristorante) {
        ensureStripeConfigured();
        Stripe.apiKey = stripeSecretKey;

        if (ristorante.getStripeCustomerId() == null || ristorante.getStripeCustomerId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Nessun cliente Stripe associato a questo account");
        }

        try {
                com.stripe.param.billingportal.SessionCreateParams params =
                    com.stripe.param.billingportal.SessionCreateParams.builder()
                    .setCustomer(ristorante.getStripeCustomerId())
                    .setReturnUrl(portalReturnUrl)
                    .build();

            com.stripe.model.billingportal.Session portalSession =
                    com.stripe.model.billingportal.Session.create(params);

            return Map.of("portalUrl", portalSession.getUrl());
        } catch (StripeException e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Errore apertura portale cliente Stripe", e);
        }
    }

    public Map<String, Object> cancelSubscription(Ristorante ristorante, boolean immediate) {
        ensureStripeConfigured();
        Stripe.apiKey = stripeSecretKey;

        if (ristorante.getStripeSubscriptionId() == null || ristorante.getStripeSubscriptionId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Nessun abbonamento attivo da annullare");
        }

        try {
            Subscription subscription;
            if (immediate) {
                subscription = Subscription.retrieve(ristorante.getStripeSubscriptionId()).cancel();
            } else {
                SubscriptionUpdateParams params = SubscriptionUpdateParams.builder()
                        .setCancelAtPeriodEnd(true)
                        .build();
                subscription = Subscription.retrieve(ristorante.getStripeSubscriptionId()).update(params);
            }

            if (immediate || "canceled".equalsIgnoreCase(subscription.getStatus())) {
                ristorante.setSubscriptionStatus(Ristorante.SubscriptionStatus.CANCELED);
                ristorante.setStripeSubscriptionId(null);
                ristorante.setSubscriptionCurrentPeriodEnd(null);
                ristorante.setSubscriptionCancelAtPeriodEnd(false);
            } else {
                applyActivePaidSubscription(ristorante, subscription);
            }

            if (ristorante.getTrialEndAt() != null
                    && OffsetDateTime.now().isAfter(ristorante.getTrialEndAt())
                    && ristorante.getSubscriptionStatus() == Ristorante.SubscriptionStatus.CANCELED) {
                ristorante.setSubscriptionStatus(Ristorante.SubscriptionStatus.EXPIRED_TRIAL);
            }

            ristoranteRepository.save(ristorante);
            return getBillingStatus(ristorante);
        } catch (StripeException e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Errore durante annullamento abbonamento", e);
        }
    }

    public Map<String, Object> reactivateSubscription(Ristorante ristorante) {
        ensureStripeConfigured();
        Stripe.apiKey = stripeSecretKey;

        if (ristorante.getStripeSubscriptionId() == null || ristorante.getStripeSubscriptionId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Nessun abbonamento Stripe trovato da riattivare");
        }

        try {
            SubscriptionUpdateParams params = SubscriptionUpdateParams.builder()
                    .setCancelAtPeriodEnd(false)
                    .build();

            Subscription subscription = Subscription.retrieve(ristorante.getStripeSubscriptionId()).update(params);
            applyActivePaidSubscription(ristorante, subscription);
            ristoranteRepository.save(ristorante);
            return getBillingStatus(ristorante);
        } catch (StripeException e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Errore durante riattivazione abbonamento", e);
        }
    }

    public List<Map<String, Object>> getInvoices(Ristorante ristorante, long limit) {
        ensureStripeConfigured();
        Stripe.apiKey = stripeSecretKey;

        if (ristorante.getStripeCustomerId() == null || ristorante.getStripeCustomerId().isBlank()) {
            return List.of();
        }

        long safeLimit = Math.min(Math.max(limit, 1L), 20L);
        try {
            InvoiceListParams params = InvoiceListParams.builder()
                    .setCustomer(ristorante.getStripeCustomerId())
                    .setLimit(safeLimit)
                    .build();

            return Invoice.list(params).getData().stream().map(invoice -> {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("id", invoice.getId());
                row.put("number", invoice.getNumber() != null ? invoice.getNumber() : "-");
                row.put("status", invoice.getStatus() != null ? invoice.getStatus() : "unknown");
                row.put("currency", invoice.getCurrency() != null ? invoice.getCurrency().toUpperCase() : "EUR");
                row.put("amountPaid", invoice.getAmountPaid() != null ? invoice.getAmountPaid() : 0L);
                row.put("periodStart", invoice.getPeriodStart());
                row.put("periodEnd", invoice.getPeriodEnd());
                row.put("hostedInvoiceUrl", invoice.getHostedInvoiceUrl() != null ? invoice.getHostedInvoiceUrl() : "");
                row.put("invoicePdf", invoice.getInvoicePdf() != null ? invoice.getInvoicePdf() : "");
                row.put("created", invoice.getCreated() != null ? invoice.getCreated() : 0L);
                return row;
            }).toList();
        } catch (StripeException e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Errore recupero fatture Stripe", e);
        }
    }

    public void handleStripeWebhook(String payload, String signatureHeader) {
        ensureStripeConfigured();
        if (stripeWebhookSecret == null || stripeWebhookSecret.isBlank()) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Stripe webhook secret non configurato");
        }

        Event event;
        try {
            event = Webhook.constructEvent(payload, signatureHeader, stripeWebhookSecret);
        } catch (SignatureVerificationException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Firma webhook non valida");
        }

        EventDataObjectDeserializer deserializer = event.getDataObjectDeserializer();
        Optional<StripeObject> stripeObject = deserializer.getObject();
        if (stripeObject.isEmpty()) {
            return;
        }

        switch (event.getType()) {
            case "checkout.session.completed" -> onCheckoutSessionCompleted((Session) stripeObject.get());
            case "customer.subscription.updated" -> onSubscriptionUpdated((Subscription) stripeObject.get());
            case "customer.subscription.deleted" -> onSubscriptionDeleted((Subscription) stripeObject.get());
            default -> {
                // Event not used for now.
            }
        }
    }

    private void onCheckoutSessionCompleted(Session session) {
        String subscriptionId = session.getSubscription();
        if (subscriptionId == null || subscriptionId.isBlank()) {
            return;
        }

        try {
            Stripe.apiKey = stripeSecretKey;
            Subscription subscription = Subscription.retrieve(
                    subscriptionId,
                    SubscriptionRetrieveParams.builder().build(),
                    null
            );

            Ristorante ristorante = resolveRistorante(session.getCustomer(), session.getClientReferenceId(), session.getMetadata());
            if (ristorante == null) {
                return;
            }

            applyActivePaidSubscription(ristorante, subscription);
            if ("PRO".equalsIgnoreCase(session.getMetadata().get("piano"))) {
                ristorante.setPiano(Ristorante.Piano.PRO);
            } else if ("ENTERPRISE".equalsIgnoreCase(session.getMetadata().get("piano"))) {
                ristorante.setPiano(Ristorante.Piano.ENTERPRISE);
            }
            ristoranteRepository.save(ristorante);
        } catch (StripeException e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Errore aggiornamento sottoscrizione da webhook", e);
        }
    }

    private void onSubscriptionUpdated(Subscription subscription) {
        Ristorante ristorante = ristoranteRepository.findByStripeSubscriptionId(subscription.getId()).orElse(null);
        if (ristorante == null) {
            ristorante = ristoranteRepository.findByStripeCustomerId(subscription.getCustomer()).orElse(null);
        }
        if (ristorante == null) {
            return;
        }

        if ("active".equalsIgnoreCase(subscription.getStatus()) || "trialing".equalsIgnoreCase(subscription.getStatus())) {
            applyActivePaidSubscription(ristorante, subscription);
        } else {
            ristorante.setSubscriptionStatus(Ristorante.SubscriptionStatus.CANCELED);
        }

        ristoranteRepository.save(ristorante);
    }

    private void onSubscriptionDeleted(Subscription subscription) {
        Ristorante ristorante = ristoranteRepository.findByStripeSubscriptionId(subscription.getId()).orElse(null);
        if (ristorante == null) {
            return;
        }

        ristorante.setSubscriptionStatus(Ristorante.SubscriptionStatus.CANCELED);
        ristorante.setStripeSubscriptionId(null);
        ristorante.setSubscriptionCurrentPeriodEnd(null);
        ristorante.setSubscriptionCancelAtPeriodEnd(false);
        if (ristorante.getTrialEndAt() != null && OffsetDateTime.now().isAfter(ristorante.getTrialEndAt())) {
            ristorante.setSubscriptionStatus(Ristorante.SubscriptionStatus.EXPIRED_TRIAL);
        }
        ristoranteRepository.save(ristorante);
    }

    private void applyActivePaidSubscription(Ristorante ristorante, Subscription subscription) {
        ristorante.setSubscriptionStatus(Ristorante.SubscriptionStatus.ACTIVE_PAID);
        ristorante.setStripeCustomerId(subscription.getCustomer());
        ristorante.setStripeSubscriptionId(subscription.getId());
        ristorante.setTrialGraceEndAt(null);
        ristorante.setSubscriptionCancelAtPeriodEnd(Boolean.TRUE.equals(subscription.getCancelAtPeriodEnd()));

        Long epoch = subscription.getCurrentPeriodEnd();
        if (epoch != null) {
            ristorante.setSubscriptionCurrentPeriodEnd(
                    OffsetDateTime.ofInstant(Instant.ofEpochSecond(epoch), ZoneOffset.UTC)
            );
        }
    }

    private Ristorante resolveRistorante(String customerId,
                                         String clientReferenceId,
                                         Map<String, String> metadata) {
        Ristorante ristorante = null;

        if (customerId != null && !customerId.isBlank()) {
            ristorante = ristoranteRepository.findByStripeCustomerId(customerId).orElse(null);
        }
        if (ristorante == null && clientReferenceId != null && !clientReferenceId.isBlank()) {
            try {
                Long id = Long.parseLong(clientReferenceId);
                ristorante = ristoranteRepository.findById(id).orElse(null);
            } catch (NumberFormatException ignored) {
            }
        }
        if (ristorante == null && metadata != null) {
            String rid = metadata.get("ristoranteId");
            if (rid != null && !rid.isBlank()) {
                try {
                    Long id = Long.parseLong(rid);
                    ristorante = ristoranteRepository.findById(id).orElse(null);
                } catch (NumberFormatException ignored) {
                }
            }
        }

        return ristorante;
    }

    private String ensureStripeCustomer(Ristorante ristorante) throws StripeException {
        if (ristorante.getStripeCustomerId() != null && !ristorante.getStripeCustomerId().isBlank()) {
            return ristorante.getStripeCustomerId();
        }

        CustomerCreateParams customerParams = CustomerCreateParams.builder()
                .setEmail(ristorante.getEmail())
                .setName(ristorante.getNome())
                .putMetadata("ristoranteId", String.valueOf(ristorante.getId()))
                .build();

        Customer customer = Customer.create(customerParams);
        ristorante.setStripeCustomerId(customer.getId());
        ristoranteRepository.save(ristorante);
        return customer.getId();
    }

    private void ensureStripeConfigured() {
        if (stripeSecretKey == null || stripeSecretKey.isBlank()) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Stripe secret key non configurata");
        }
    }
}
