package com.example.restaurant.subscription;

import com.example.restaurant.cloud.CloudClient;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Legge lo stato dell'abbonamento dal cloud (/api/billing/status) con cache e tolleranza offline.
 */
@Service
public class SubscriptionGate {

    public static final String TRIAL_EXPIRED = "TRIAL_EXPIRED";
    public static final String SUBSCRIPTION_UNVERIFIED = "SUBSCRIPTION_UNVERIFIED";

    private record Entry(boolean blocked, Instant fetchedAt) {}

    private final CloudClient cloud;
    private final Duration ttl;
    private final Duration offlineGrace;
    private final ObjectMapper mapper = new ObjectMapper();
    private final Map<String, Entry> cache = new ConcurrentHashMap<>();

    public SubscriptionGate(CloudClient cloud,
                            @Value("${app.subscription.cache-minutes:1440}") long cacheMinutes,
                            @Value("${app.subscription.offline-grace-days:7}") long graceDays) {
        this.cloud = cloud;
        this.ttl = Duration.ofMinutes(cacheMinutes);
        this.offlineGrace = Duration.ofDays(graceDays);
    }

    /** Ritorna il codice di blocco delle scritture, oppure null se consentite. */
    public String writeBlockReason(String email, String bearerToken) {
        Entry entry = cache.get(email);
        Instant now = Instant.now();
        if (entry != null && now.isBefore(entry.fetchedAt().plus(ttl))) {
            return entry.blocked() ? TRIAL_EXPIRED : null;
        }
        try {
            boolean blocked = fetchBlocked(bearerToken);
            cache.put(email, new Entry(blocked, now));
            return blocked ? TRIAL_EXPIRED : null;
        } catch (Exception e) {
            if (e instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            if (entry == null) {
                return null;
            }
            if (now.isAfter(entry.fetchedAt().plus(offlineGrace))) {
                return SUBSCRIPTION_UNVERIFIED;
            }
            return entry.blocked() ? TRIAL_EXPIRED : null;
        }
    }

    private boolean fetchBlocked(String bearerToken) throws Exception {
        HttpResponse<byte[]> response = cloud.send("GET", "/api/billing/status",
                Map.of("Authorization", "Bearer " + bearerToken, "Accept", "application/json"), null);
        if (response.statusCode() != 200) {
            throw new IllegalStateException("HTTP " + response.statusCode());
        }
        JsonNode json = mapper.readTree(response.body());
        String status = json.path("subscriptionStatus").asText("");
        String trialEnd = json.path("trialEndAt").asText("");
        if ("ACTIVE_PAID".equals(status) || trialEnd.isBlank() || "null".equals(trialEnd)) {
            return false;
        }
        return OffsetDateTime.now().isAfter(OffsetDateTime.parse(trialEnd));
    }
}
