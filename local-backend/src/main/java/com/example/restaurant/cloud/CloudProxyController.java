package com.example.restaurant.cloud;

import com.example.restaurant.subscription.SubscriptionGate;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Inoltra al backend cloud le chiamate di autenticazione, registrazione e abbonamento.
 */
@RestController
public class CloudProxyController {

    private static final Logger log = LoggerFactory.getLogger(CloudProxyController.class);
    private static final String[] FORWARDED_HEADERS = {
            HttpHeaders.AUTHORIZATION, HttpHeaders.CONTENT_TYPE, HttpHeaders.ACCEPT, HttpHeaders.ACCEPT_LANGUAGE
    };

    private final CloudClient cloud;
    private final SubscriptionGate subscriptionGate;

    public CloudProxyController(CloudClient cloud, SubscriptionGate subscriptionGate) {
        this.cloud = cloud;
        this.subscriptionGate = subscriptionGate;
    }

    @RequestMapping({"/api/auth/**", "/api/ristoranti", "/api/ristoranti/**", "/api/billing/**"})
    public ResponseEntity<byte[]> forward(HttpServletRequest request) throws IOException {
        Map<String, String> headers = new LinkedHashMap<>();
        for (String name : FORWARDED_HEADERS) {
            String value = request.getHeader(name);
            if (value != null) {
                headers.put(name, value);
            }
        }
        String query = request.getQueryString();
        String target = request.getRequestURI() + (query != null ? "?" + query : "");
        byte[] body = request.getInputStream().readAllBytes();

        try {
            HttpResponse<byte[]> response = cloud.send(request.getMethod(), target, headers, body);
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (request.getRequestURI().startsWith("/api/billing/")
                    && response.statusCode() >= 200 && response.statusCode() < 300
                    && authentication != null && authentication.getPrincipal() instanceof String email) {
                subscriptionGate.refreshFromBillingStatus(email, response.body());
            }
            ResponseEntity.BodyBuilder out = ResponseEntity.status(response.statusCode());
            response.headers().firstValue(HttpHeaders.CONTENT_TYPE)
                    .ifPresent(v -> out.header(HttpHeaders.CONTENT_TYPE, v));
            return out.body(response.body());
        } catch (IOException e) {
            log.warn("Cloud non raggiungibile ({}): {}", target, e.getMessage());
            return unavailable();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return unavailable();
        }
    }

    private ResponseEntity<byte[]> unavailable() {
        String json = "{\"code\":\"CLOUD_UNAVAILABLE\",\"message\":\"Servizio cloud non raggiungibile. Controlla la connessione internet.\"}";
        return ResponseEntity.status(503)
                .contentType(MediaType.APPLICATION_JSON)
                .body(json.getBytes(StandardCharsets.UTF_8));
    }
}
