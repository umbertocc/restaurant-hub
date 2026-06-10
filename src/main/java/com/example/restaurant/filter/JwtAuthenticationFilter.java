package com.example.restaurant.filter;

import com.example.restaurant.util.JwtUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    public JwtAuthenticationFilter(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            if (token.isBlank()) {
                rejectUnauthorized(response, "Token mancante");
                return;
            }

            try {
                if (!jwtUtil.isTokenValid(token)) {
                    rejectUnauthorized(response, "Token non valido o scaduto");
                    return;
                }

                String username = jwtUtil.extractUsername(token);
                String role = jwtUtil.extractRole(token);
                Long ristoranteId = jwtUtil.extractRistoranteId(token);
                if (ristoranteId != null) {
                    request.setAttribute("ristoranteId", ristoranteId);
                }
                var auth = new UsernamePasswordAuthenticationToken(
                        username, null,
                        List.of(new SimpleGrantedAuthority("ROLE_" + role))
                );
                SecurityContextHolder.getContext().setAuthentication(auth);
            } catch (Exception ex) {
                rejectUnauthorized(response, "Token non valido o scaduto");
                return;
            }
        }
        filterChain.doFilter(request, response);
    }

    private void rejectUnauthorized(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setHeader("WWW-Authenticate", "Bearer");
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write("{\"status\":401,\"error\":\"" + message + "\"}");
    }
}
