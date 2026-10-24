package com.example.restaurant.util;

import com.example.restaurant.cloud.CloudClient;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.http.HttpResponse;
import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;
import java.util.Date;
import java.util.Map;

/**
 * Verifica i token emessi dal cloud con la sola chiave pubblica: il locale non puo' emettere token.
 */
@Component
public class JwtUtil {

    private final CloudClient cloud;
    private final String configuredKey;
    private final ObjectMapper mapper = new ObjectMapper();
    private volatile PublicKey publicKey;

    private final String localRistoranteId;

    public JwtUtil(CloudClient cloud,
                   @Value("${jwt.public-key:}") String configuredKey,
                   @Value("${app.local.ristorante-id:}") String localRistoranteId) {
        this.cloud = cloud;
        this.configuredKey = configuredKey;
        this.localRistoranteId = localRistoranteId.trim();
    }

    private PublicKey publicKey() throws Exception {
        PublicKey key = publicKey;
        if (key != null) {
            return key;
        }
        synchronized (this) {
            if (publicKey == null) {
                String base64 = configuredKey;
                if (base64 == null || base64.isBlank()) {
                    HttpResponse<byte[]> response = cloud.send("GET", "/api/auth/public-key", Map.of(), null);
                    if (response.statusCode() != 200) {
                        throw new IllegalStateException("Chiave pubblica non disponibile: HTTP " + response.statusCode());
                    }
                    base64 = mapper.readTree(response.body()).get("publicKey").asText();
                }
                base64 = base64.replaceAll("-----[A-Z ]+-----", "").replaceAll("\\s", "");
                publicKey = KeyFactory.getInstance("RSA")
                        .generatePublic(new X509EncodedKeySpec(Base64.getDecoder().decode(base64)));
            }
            return publicKey;
        }
    }

    public Long extractRistoranteId(String token) {
        Object val = extractClaims(token).get("ristoranteId");
        if (val instanceof Integer) return ((Integer) val).longValue();
        if (val instanceof Long) return (Long) val;
        return null;
    }

    public Claims extractClaims(String token) {
        try {
            return Jwts.parser()
                    .setSigningKey(publicKey())
                    .parseClaimsJws(token)
                    .getBody();
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalStateException(e.getMessage(), e);
        }
    }

    public String extractUsername(String token) {
        return extractClaims(token).getSubject();
    }

    public String extractRole(String token) {
        return (String) extractClaims(token).get("role");
    }

    public boolean isTokenValid(String token) {
        try {
            Claims claims = extractClaims(token);
            if (!localRistoranteId.isBlank()
                    && !localRistoranteId.equals(String.valueOf(extractRistoranteId(token)))) {
                return false;
            }
            return claims.getExpiration().after(new Date());
        } catch (Exception e) {
            return false;
        }
    }
}
