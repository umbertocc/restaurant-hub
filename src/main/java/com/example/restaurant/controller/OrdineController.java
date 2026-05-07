package com.example.restaurant.controller;

import com.example.restaurant.dto.OrdineDTO;
import com.example.restaurant.model.Ordine;
import com.example.restaurant.service.OrdineService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/ordini")
public class OrdineController {

    private final OrdineService ordineService;

    public OrdineController(OrdineService ordineService) {
        this.ordineService = ordineService;
    }

    // POST /api/ordini  (cameriere)
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Ordine crea(@Valid @RequestBody OrdineDTO dto) {
        return ordineService.crea(dto);
    }

    // GET /api/ordini/{id}
    @GetMapping("/{id}")
    public Ordine getById(@PathVariable UUID id) {
        return ordineService.getById(id);
    }

    // GET /api/ordini  (admin)
    @GetMapping
    public List<Ordine> getAll(HttpServletRequest request) {
        Long ristoranteId = (Long) request.getAttribute("ristoranteId");
        return ordineService.getByRistorante(ristoranteId);
    }

    // PATCH /api/ordini/{id}/stato
    @PatchMapping("/{id}/stato")
    public Ordine aggiornaStato(@PathVariable UUID id,
                                @RequestParam Ordine.Stato stato) {
        return ordineService.aggiornaStato(id, stato);
    }
}
