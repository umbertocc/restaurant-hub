package com.example.restaurant.controller;

import com.example.restaurant.model.Ristorante;
import com.example.restaurant.repository.RistoranteRepository;
import com.example.restaurant.service.NotificaService;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ristoranti")
public class RistoranteController {

    private final RistoranteRepository ristoranteRepository;
    private final PasswordEncoder passwordEncoder;
    private final NotificaService notificaService;

    public RistoranteController(RistoranteRepository ristoranteRepository,
                                PasswordEncoder passwordEncoder,
                                NotificaService notificaService) {
        this.ristoranteRepository = ristoranteRepository;
        this.passwordEncoder = passwordEncoder;
        this.notificaService = notificaService;
    }

    // GET /api/ristoranti  (solo super-admin)
    @GetMapping
    public List<Ristorante> getAll() {
        return ristoranteRepository.findAll();
    }

    // GET /api/ristoranti/{id}
    @GetMapping("/{id}")
    public Ristorante getById(@PathVariable Long id) {
        return ristoranteRepository.findById(id)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Ristorante non trovato"));
    }

    // POST /api/ristoranti  (registrazione nuovo ristorante)
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Ristorante registra(@RequestBody Ristorante ristorante) {
        if (ristoranteRepository.existsByEmail(ristorante.getEmail())) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.CONFLICT, "Email già registrata");
        }
        if (ristorante.getPasswordHash() != null && !ristorante.getPasswordHash().isBlank()) {
            ristorante.setPasswordHash(passwordEncoder.encode(ristorante.getPasswordHash()));
        }
        Ristorante salvato = ristoranteRepository.save(ristorante);
        notificaService.notificaNuovaRegistrazione(salvato);
        return salvato;
    }

    // PUT /api/ristoranti/{id}  (admin ristorante)
    @PutMapping("/{id}")
    public Ristorante aggiorna(@PathVariable Long id, @RequestBody Ristorante aggiornato) {
        Ristorante existing = ristoranteRepository.findById(id)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Ristorante non trovato"));
        existing.setNome(aggiornato.getNome());
        existing.setTelefono(aggiornato.getTelefono());
        existing.setIndirizzo(aggiornato.getIndirizzo());
        existing.setCitta(aggiornato.getCitta());
        existing.setLogoUrl(aggiornato.getLogoUrl());
        return ristoranteRepository.save(existing);
    }
}
