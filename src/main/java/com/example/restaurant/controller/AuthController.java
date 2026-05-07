package com.example.restaurant.controller;

import com.example.restaurant.model.Ristorante;
import com.example.restaurant.repository.RistoranteRepository;
import com.example.restaurant.util.JwtUtil;
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
}
