package com.example.restaurant.cloud;

import com.example.restaurant.model.CopertoConfig;
import com.example.restaurant.repository.CopertoConfigRepository;
import com.example.restaurant.subscription.SubscriptionGate;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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
 * Inoltra al cloud autenticazione, profilo e abbonamento, sincronizzando il prezzo coperto locale.
 */
@RestController
public class CloudProxyController {

    private static final Logger log = LoggerFactory.getLogger(CloudProxyController.class);
    private static final String[] FORWARDED_HEADERS = {
            HttpHeaders.AUTHORIZATION, HttpHeaders.CONTENT_TYPE, HttpHeaders.ACCEPT, HttpHeaders.ACCEPT_LANGUAGE
    };

    private final CloudClient cloud;
    private final SubscriptionGate subscriptionGate;
    private final CopertoConfigRepository copertoConfigRepository;
    private final ObjectMapper objectMapper;

    public CloudProxyController(CloudClient cloud,
                                SubscriptionGate subscriptionGate,
                                CopertoConfigRepository copertoConfigRepository,
                                ObjectMapper objectMapper) {
        this.cloud = cloud;
        this.subscriptionGate = subscriptionGate;
        this.copertoConfigRepository = copertoConfigRepository;
        this.objectMapper = objectMapper;
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
            cacheCopertoPrice(request, response);
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

    private void cacheCopertoPrice(HttpServletRequest request, HttpResponse<byte[]> response) {
        String path = request.getRequestURI();
        String method = request.getMethod();
        if (!path.matches("/api/ristoranti/\\d+") ||
                !(method.equals("GET") || method.equals("PUT")) ||
                response.statusCode() < 200 || response.statusCode() >= 300) {
            return;
        }

        try {
            JsonNode restaurant = objectMapper.readTree(response.body());
            JsonNode id = restaurant.get("id");
            JsonNode price = restaurant.get("prezzoCoperto");
            if (id == null || !id.isNumber() || price == null || !price.isNumber()
                    || price.decimalValue().signum() < 0) {
                log.warn("Prezzo coperto non presente o non valido nella risposta cloud per {}", path);
                return;
            }

            CopertoConfig config = new CopertoConfig();
            config.setRistoranteId(id.longValue());
            config.setPrezzoCoperto(price.decimalValue());
            copertoConfigRepository.save(config);
        } catch (JsonProcessingException e) {
            log.warn("Impossibile leggere il prezzo coperto dalla risposta cloud per {}", path, e);
        }
    }

    private ResponseEntity<byte[]> unavailable() {
        String json = "{\"code\":\"CLOUD_UNAVAILABLE\",\"message\":\"Servizio cloud non raggiungibile. Controlla la connessione internet.\"}";
        return ResponseEntity.status(503)
                .contentType(MediaType.APPLICATION_JSON)
                .body(json.getBytes(StandardCharsets.UTF_8));
    }
}
