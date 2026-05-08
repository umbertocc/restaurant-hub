package com.example.restaurant.controller;

import com.example.restaurant.model.Ristorante;
import com.example.restaurant.repository.RistoranteRepository;
import com.example.restaurant.util.JwtUtil;
import com.example.restaurant.dto.ChangePasswordRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final RistoranteRepository ristoranteRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthController(RistoranteRepository ristoranteRepository,
                          PasswordEncoder passwordEncoder,
                          JwtUtil jwtUtil) {
        this.ristoranteRepository = ristoranteRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
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
