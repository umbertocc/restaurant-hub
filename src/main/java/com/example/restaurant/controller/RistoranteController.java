package com.example.restaurant.controller;

import com.example.restaurant.model.Ristorante;
import com.example.restaurant.repository.RistoranteRepository;
import com.example.restaurant.service.NotificaService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import com.example.restaurant.repository.RistoranteRuoloRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ristoranti")
public class RistoranteController {

    private final RistoranteRepository ristoranteRepository;
    private final PasswordEncoder passwordEncoder;
    private final NotificaService notificaService;
    private final RistoranteRuoloRepository ristoranteRuoloRepository;

    // Rimosso registrationCode: non più richiesto

    public RistoranteController(RistoranteRepository ristoranteRepository,
                                PasswordEncoder passwordEncoder,
                                NotificaService notificaService,
                                RistoranteRuoloRepository ristoranteRuoloRepository) {
        this.ristoranteRepository = ristoranteRepository;
        this.passwordEncoder = passwordEncoder;
        this.notificaService = notificaService;
        this.ristoranteRuoloRepository = ristoranteRuoloRepository;
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
        if (ristorante.getPasswordHash() == null || ristorante.getPasswordHash().length() < 8) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "La password deve essere lunga almeno 8 caratteri");
        }
        if (ristorante.getPasswordHash() != null && !ristorante.getPasswordHash().isBlank()) {
            ristorante.setPasswordHash(passwordEncoder.encode(ristorante.getPasswordHash()));
        }
        ristorante.setAttivo(false); // Nuovi ristoranti in attesa di approvazione
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
    // PATCH /api/ristoranti/{id}/approva (solo superadmin)
    @PatchMapping("/{id}/approva")
    public void approvaRistorante(@PathVariable Long id) {
        // Recupera l'email dal principal
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (!(principal instanceof String email)) {
            throw new org.springframework.web.server.ResponseStatusException(HttpStatus.FORBIDDEN, "Utente non autenticato");
        }
        Ristorante ristoratore = ristoranteRepository.findByEmail(email)
            .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(HttpStatus.FORBIDDEN, "Utente non trovato"));
        Long ristoranteId = ristoratore.getId();
        // Controlla che l'utente abbia il ruolo superadmin
        var ruoli = ristoranteRuoloRepository.findRuoliByRistoranteId(ristoranteId);
        if (ruoli == null || !ruoli.contains("superadmin")) {
            throw new org.springframework.web.server.ResponseStatusException(HttpStatus.FORBIDDEN, "Permesso negato: solo superadmin");
        }
        Ristorante ristorante = ristoranteRepository.findById(id)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Ristorante non trovato"));
        ristorante.setAttivo(true);
        ristoranteRepository.save(ristorante);
    }
}
