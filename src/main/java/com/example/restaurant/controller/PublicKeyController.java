package com.example.restaurant.controller;

import com.example.restaurant.util.JwtUtil;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class PublicKeyController {

    private final JwtUtil jwtUtil;

    public PublicKeyController(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    // Chiave pubblica (X.509, base64) usata dai backend locali per verificare i token
    @GetMapping("/public-key")
    public Map<String, String> publicKey() {
        return Map.of("algorithm", "RS256", "publicKey", jwtUtil.getPublicKeyBase64());
    }
}
