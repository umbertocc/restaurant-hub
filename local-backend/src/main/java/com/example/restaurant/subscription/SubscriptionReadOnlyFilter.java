package com.example.restaurant.subscription;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Set;

/** Blocca le scritture quando l'abbonamento (letto dal cloud) e' scaduto. */
@Component
public class SubscriptionReadOnlyFilter extends OncePerRequestFilter {

    private static final Set<String> SAFE_METHODS = Set.of("GET", "HEAD", "OPTIONS");

    private final SubscriptionGate gate;

    public SubscriptionReadOnlyFilter(SubscriptionGate gate) {
        this.gate = gate;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {
        String path = request.getRequestURI();
        boolean proxied = path.startsWith("/api/auth/") || path.startsWith("/api/billing/")
                || path.startsWith("/api/ristoranti");
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String header = request.getHeader("Authorization");

        if (SAFE_METHODS.contains(request.getMethod()) || proxied || header == null
                || authentication == null || !(authentication.getPrincipal() instanceof String email)) {
            filterChain.doFilter(request, response);
            return;
        }

        String reason = gate.writeBlockReason(email, header.substring(7));
        if (reason == null) {
            filterChain.doFilter(request, response);
            return;
        }

        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        String message = SubscriptionGate.TRIAL_EXPIRED.equals(reason)
                ? "Trial scaduto: account in sola lettura. Effettua upgrade per continuare a modificare dati."
                : "Impossibile verificare l'abbonamento da troppo tempo. Collega il PC a internet.";
        response.getWriter().write("{\"code\":\"" + reason + "\",\"message\":\"" + message + "\"}");
    }
}
