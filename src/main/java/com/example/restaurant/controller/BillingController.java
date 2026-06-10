package com.example.restaurant.controller;

import com.example.restaurant.dto.BillingCheckoutRequest;
import com.example.restaurant.dto.BillingCancelRequest;
import com.example.restaurant.model.Ristorante;
import com.example.restaurant.repository.RistoranteRepository;
import com.example.restaurant.service.BillingService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/api/billing")
public class BillingController {

    private final RistoranteRepository ristoranteRepository;
    private final BillingService billingService;

    public BillingController(RistoranteRepository ristoranteRepository, BillingService billingService) {
        this.ristoranteRepository = ristoranteRepository;
        this.billingService = billingService;
    }

    @GetMapping("/status")
    public Map<String, Object> status(Authentication authentication) {
        Ristorante ristorante = getAuthenticatedRistorante(authentication);
        return billingService.getBillingStatus(ristorante);
    }

    @PostMapping("/checkout-session")
    public Map<String, Object> createCheckoutSession(Authentication authentication,
                                                     @Valid @RequestBody BillingCheckoutRequest request) {
        Ristorante ristorante = getAuthenticatedRistorante(authentication);
        return billingService.createCheckoutSession(ristorante, request.getPiano());
    }

    @PostMapping("/customer-portal-session")
    public Map<String, Object> createCustomerPortalSession(Authentication authentication) {
        Ristorante ristorante = getAuthenticatedRistorante(authentication);
        return billingService.createCustomerPortalSession(ristorante);
    }

    @GetMapping("/invoices")
    public java.util.List<Map<String, Object>> invoices(Authentication authentication,
                                                        @RequestParam(name = "limit", defaultValue = "8") long limit) {
        Ristorante ristorante = getAuthenticatedRistorante(authentication);
        return billingService.getInvoices(ristorante, limit);
    }

    @PostMapping("/cancel")
    public Map<String, Object> cancelSubscription(Authentication authentication,
                                                  @RequestBody(required = false) BillingCancelRequest request) {
        Ristorante ristorante = getAuthenticatedRistorante(authentication);
        boolean immediate = request != null && Boolean.TRUE.equals(request.getImmediate());
        return billingService.cancelSubscription(ristorante, immediate);
    }

    @PostMapping("/reactivate")
    public Map<String, Object> reactivateSubscription(Authentication authentication) {
        Ristorante ristorante = getAuthenticatedRistorante(authentication);
        return billingService.reactivateSubscription(ristorante);
    }

    @PostMapping("/webhook")
    public ResponseEntity<Void> webhook(@RequestBody String payload,
                                        @RequestHeader(value = "Stripe-Signature", required = false) String signature) {
        if (signature == null || signature.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Stripe-Signature mancante");
        }
        billingService.handleStripeWebhook(payload, signature);
        return ResponseEntity.ok().build();
    }

    private Ristorante getAuthenticatedRistorante(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof String email)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Utente non autenticato");
        }

        return ristoranteRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Ristorante non trovato"));
    }
}
