package com.example.restaurant.controller;

import com.example.restaurant.dto.PrenotazioneDTO;
import com.example.restaurant.model.Prenotazione;
import com.example.restaurant.service.PrenotazioneService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/prenotazioni")
public class PrenotazioneController {

    private final PrenotazioneService prenotazioneService;

    public PrenotazioneController(PrenotazioneService prenotazioneService) {
        this.prenotazioneService = prenotazioneService;
    }

    // GET /api/prenotazioni?ristoranteId=1
    @GetMapping
    public List<Prenotazione> getAll(@RequestParam Long ristoranteId) {
        return prenotazioneService.getByRistorante(ristoranteId);
    }

    // GET /api/prenotazioni/{id}
    @GetMapping("/{id}")
    public Prenotazione getById(@PathVariable UUID id) {
        return prenotazioneService.getById(id);
    }

    // POST /api/prenotazioni  (pubblico, clienti)
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Prenotazione crea(@Valid @RequestBody PrenotazioneDTO dto) {
        return prenotazioneService.crea(dto);
    }

    // PATCH /api/prenotazioni/{id}/stato  (solo admin ristorante)
    @PatchMapping("/{id}/stato")
    public Prenotazione aggiornaStato(@PathVariable UUID id,
                                      @RequestParam Prenotazione.Stato stato) {
        return prenotazioneService.aggiornaStato(id, stato);
    }

    // DELETE /api/prenotazioni/{id}  (solo admin)
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void elimina(@PathVariable UUID id) {
        prenotazioneService.elimina(id);
    }
}
