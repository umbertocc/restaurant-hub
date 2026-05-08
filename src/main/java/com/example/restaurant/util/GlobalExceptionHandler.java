package com.example.restaurant.util;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {
        @ExceptionHandler(ResponseStatusException.class)
        public ResponseEntity<?> handleResponseStatusException(ResponseStatusException ex) {
        // Se 401 e motivo è legato a token/autenticazione, aggiungi header WWW-Authenticate
        boolean isAuthError = ex.getStatusCode().value() == 401 && (
            ex.getReason() != null && (
                ex.getReason().toLowerCase().contains("token") ||
                ex.getReason().toLowerCase().contains("credenziali non valide") ||
                ex.getReason().toLowerCase().contains("utente non trovato")
            )
        );
        ResponseEntity.BodyBuilder builder = ResponseEntity.status(ex.getStatusCode());
        if (isAuthError) {
            builder.header("WWW-Authenticate", "Bearer");
        }
        return builder.body(Map.of(
            "status", ex.getStatusCode().value(),
            "error", ex.getReason()
        ));
        }
}
