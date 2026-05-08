package com.example.restaurant.controller;

import com.example.restaurant.model.Ristorante;
import com.example.restaurant.repository.RistoranteRepository;
import com.example.restaurant.util.JwtUtil;
import com.example.restaurant.model.PasswordResetToken;
import com.example.restaurant.repository.PasswordResetTokenRepository;
import java.time.OffsetDateTime;
import java.util.UUID;
import com.example.restaurant.dto.ChangePasswordRequest;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import com.example.restaurant.service.NotificaService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final RistoranteRepository ristoranteRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final NotificaService notificaService;



    public AuthController(RistoranteRepository ristoranteRepository,
                          PasswordEncoder passwordEncoder,
                          JwtUtil jwtUtil,
                          PasswordResetTokenRepository passwordResetTokenRepository,
                          NotificaService notificaService) {
        this.ristoranteRepository = ristoranteRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.notificaService = notificaService;
    }
       
       
       
       
        @PostMapping("/forgot-password")
        @Transactional
        public Map<String, String> forgotPassword(@RequestBody Map<String, String> body) {
            String email = body.get("email");
            if (email == null || email.isBlank()) {
                throw new org.springframework.web.server.ResponseStatusException(HttpStatus.BAD_REQUEST, "Email obbligatoria");
            }
            Ristorante ristorante = ristoranteRepository.findByEmail(email)
                .orElse(null);
            // Risposta sempre generica per sicurezza
            if (ristorante != null) {
                // Invalida eventuali token precedenti
                passwordResetTokenRepository.deleteByRistorante(ristorante);
                String token = UUID.randomUUID().toString();
                OffsetDateTime expiry = OffsetDateTime.now().plusMinutes(30);
                PasswordResetToken resetToken = new PasswordResetToken(token, ristorante, expiry);
                passwordResetTokenRepository.save(resetToken);
                notificaService.notificaResetPassword(ristorante, token);
            }
            return Map.of("message", "Se l'email esiste riceverai istruzioni per il reset.");
        }

        @PostMapping("/reset-password")
        public Map<String, String> resetPassword(@RequestBody Map<String, String> body) {
            String token = body.get("token");
            String newPassword = body.get("newPassword");
            if (token == null || newPassword == null || newPassword.length() < 8) {
                throw new org.springframework.web.server.ResponseStatusException(HttpStatus.BAD_REQUEST, "Token o nuova password non validi");
            }
            PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(token)
                    .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(HttpStatus.BAD_REQUEST, "Token non valido"));
            if (resetToken.getExpiryDate().isBefore(OffsetDateTime.now())) {
                throw new org.springframework.web.server.ResponseStatusException(HttpStatus.BAD_REQUEST, "Token scaduto");
            }
            Ristorante ristorante = resetToken.getRistorante();
            ristorante.setPasswordHash(passwordEncoder.encode(newPassword));
            ristoranteRepository.save(ristorante);
            passwordResetTokenRepository.delete(resetToken);
            return Map.of("message", "Password aggiornata con successo");
        }
    

    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String password = body.get("password");

        Ristorante ristorante = ristoranteRepository.findByEmail(email)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Credenziali non valide"));

        if (ristorante.getPasswordHash() == null ||
                !passwordEncoder.matches(password, ristorante.getPasswordHash())) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.UNAUTHORIZED, "Credenziali non valide");
        }

        String token = jwtUtil.generateToken(email, "RISTORANTE", ristorante.getId());
        return Map.of("token", token, "ristorante", ristorante);
    }

        @PostMapping("/change-password")
        public Map<String, String> changePassword(@RequestBody ChangePasswordRequest request, @RequestHeader("Authorization") String authHeader) {
        // Estrai email dal token JWT
        String token = authHeader.replace("Bearer ", "");
        String email = jwtUtil.extractUsername(token);

        Ristorante ristorante = ristoranteRepository.findByEmail(email)
            .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                HttpStatus.UNAUTHORIZED, "Utente non trovato"));

        if (ristorante.getPasswordHash() == null ||
            !passwordEncoder.matches(request.getOldPassword(), ristorante.getPasswordHash())) {
            throw new org.springframework.web.server.ResponseStatusException(
                HttpStatus.UNAUTHORIZED, "Vecchia password errata");
        }

        // Validazione semplice della nuova password (puoi rafforzare la logica)
        if (request.getNewPassword() == null || request.getNewPassword().length() < 8) {
            throw new org.springframework.web.server.ResponseStatusException(
                HttpStatus.BAD_REQUEST, "La nuova password deve essere lunga almeno 8 caratteri");
        }

        ristorante.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        ristoranteRepository.save(ristorante);

        return Map.of("message", "Password cambiata con successo");
        }
}

