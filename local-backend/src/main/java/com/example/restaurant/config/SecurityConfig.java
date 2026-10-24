package com.example.restaurant.config;

import com.example.restaurant.filter.JwtAuthenticationFilter;
import com.example.restaurant.subscription.SubscriptionReadOnlyFilter;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final SubscriptionReadOnlyFilter subscriptionReadOnlyFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter,
                          SubscriptionReadOnlyFilter subscriptionReadOnlyFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.subscriptionReadOnlyFilter = subscriptionReadOnlyFilter;
    }

    // Evita la registrazione automatica come filtro servlet: devono girare solo nella catena di Spring Security
    @Bean
    public FilterRegistrationBean<JwtAuthenticationFilter> jwtFilterRegistration(JwtAuthenticationFilter filter) {
        FilterRegistrationBean<JwtAuthenticationFilter> registration = new FilterRegistrationBean<>(filter);
        registration.setEnabled(false);
        return registration;
    }

    @Bean
    public FilterRegistrationBean<SubscriptionReadOnlyFilter> subscriptionFilterRegistration(SubscriptionReadOnlyFilter filter) {
        FilterRegistrationBean<SubscriptionReadOnlyFilter> registration = new FilterRegistrationBean<>(filter);
        registration.setEnabled(false);
        return registration;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/health").permitAll()
                // Endpoint pubblici per i clienti (QR sul Wi-Fi del locale)
                .requestMatchers(HttpMethod.POST, "/api/prenotazioni").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/menu").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/abbinamenti/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/ordini").permitAll()
                .requestMatchers("/ws/**").permitAll()
                // Inoltrati al cloud, che applica la propria autenticazione
                .requestMatchers("/api/auth/**", "/api/billing/**", "/api/ristoranti", "/api/ristoranti/**").permitAll()
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterAfter(subscriptionReadOnlyFilter, JwtAuthenticationFilter.class);
        return http.build();
    }
}
