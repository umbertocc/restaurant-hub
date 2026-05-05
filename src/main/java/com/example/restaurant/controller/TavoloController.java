package com.example.restaurant.controller;

import com.example.restaurant.model.Tavolo;
import com.example.restaurant.repository.TavoloRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tavoli")
public class TavoloController {

    private final TavoloRepository tavoloRepository;

    public TavoloController(TavoloRepository tavoloRepository) {
        this.tavoloRepository = tavoloRepository;
    }

    @GetMapping
    public List<Tavolo> getAll(@RequestParam Long ristoranteId) {
        return tavoloRepository.findByRistoranteId(ristoranteId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Tavolo crea(@RequestBody Tavolo tavolo) {
        return tavoloRepository.save(tavolo);
    }

    @PutMapping("/{id}")
    public Tavolo aggiorna(@PathVariable Long id, @RequestBody Tavolo aggiornato) {
        Tavolo existing = tavoloRepository.findById(id)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Tavolo non trovato"));
        existing.setNumero(aggiornato.getNumero());
        existing.setCapacita(aggiornato.getCapacita());
        existing.setDisponibile(aggiornato.getDisponibile());
        existing.setPosizione(aggiornato.getPosizione());
        return tavoloRepository.save(existing);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void elimina(@PathVariable Long id) {
        tavoloRepository.deleteById(id);
    }
}
