package com.example.restaurant.config;

import com.example.restaurant.filter.JwtAuthenticationFilter;
import com.example.restaurant.filter.TrialReadOnlyFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final TrialReadOnlyFilter trialReadOnlyFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter,
                          TrialReadOnlyFilter trialReadOnlyFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.trialReadOnlyFilter = trialReadOnlyFilter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                // Preflight CORS
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                // Health check (keep-alive)
                .requestMatchers(HttpMethod.GET, "/api/health").permitAll()
                // Endpoint pubblici (clienti)
                .requestMatchers(HttpMethod.POST, "/api/prenotazioni").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/menu").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/abbinamenti/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/ristoranti/*").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/ordini").permitAll()
                // Handshake WebSocket (auth applicata su STOMP CONNECT)
                .requestMatchers("/ws/**").permitAll()
                // Registrazione ristorante
                .requestMatchers(HttpMethod.POST, "/api/ristoranti").permitAll()
                // Login
                .requestMatchers("/api/auth/**").permitAll()
                // Stripe webhook
                .requestMatchers(HttpMethod.POST, "/api/billing/webhook").permitAll()
                // PATCH approvazione ristorante: autenticazione obbligatoria
                .requestMatchers(HttpMethod.PATCH, "/api/ristoranti/*/approva").authenticated()
                // Tutto il resto richiede autenticazione
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterAfter(trialReadOnlyFilter, JwtAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
