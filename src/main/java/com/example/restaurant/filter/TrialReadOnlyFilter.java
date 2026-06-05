package com.example.restaurant.filter;

import com.example.restaurant.model.Ristorante;
import com.example.restaurant.repository.RistoranteRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.OffsetDateTime;
import java.util.Set;

@Component
public class TrialReadOnlyFilter extends OncePerRequestFilter {

    private static final Set<String> SAFE_METHODS = Set.of("GET", "HEAD", "OPTIONS");

    private final RistoranteRepository ristoranteRepository;

    public TrialReadOnlyFilter(RistoranteRepository ristoranteRepository) {
        this.ristoranteRepository = ristoranteRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        if (SAFE_METHODS.contains(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        String path = request.getRequestURI();
        // Consenti cambio password anche con trial scaduto.
        if ("/api/auth/change-password".equals(path)) {
            filterChain.doFilter(request, response);
            return;
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof String email)) {
            filterChain.doFilter(request, response);
            return;
        }

        Ristorante ristorante = ristoranteRepository.findByEmail(email).orElse(null);
        if (ristorante == null || ristorante.getTrialEndAt() == null) {
            filterChain.doFilter(request, response);
            return;
        }

        if (OffsetDateTime.now().isAfter(ristorante.getTrialEndAt())) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write("{\"message\":\"Trial scaduto: account in sola lettura. Effettua upgrade per continuare a modificare dati.\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }
}
