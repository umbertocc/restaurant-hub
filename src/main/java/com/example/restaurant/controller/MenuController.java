package com.example.restaurant.controller;

import com.example.restaurant.model.MenuItem;
import com.example.restaurant.repository.MenuItemRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/menu")
public class MenuController {

    private final MenuItemRepository menuItemRepository;

    public MenuController(MenuItemRepository menuItemRepository) {
        this.menuItemRepository = menuItemRepository;
    }

    // GET /api/menu?ristoranteId=1  (pubblico)
    @GetMapping
    public List<MenuItem> getMenu(@RequestParam Long ristoranteId) {
        return menuItemRepository.findByRistoranteIdAndDisponibile(ristoranteId, true);
    }

    // GET /api/menu/{id}
    @GetMapping("/{id}")
    public MenuItem getById(@PathVariable Long id) {
        return menuItemRepository.findById(id)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Prodotto non trovato"));
    }

    // POST /api/menu  (admin ristorante)
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MenuItem crea(@RequestBody MenuItem menuItem) {
        return menuItemRepository.save(menuItem);
    }

    // PUT /api/menu/{id}  (admin ristorante)
    @PutMapping("/{id}")
    public MenuItem aggiorna(@PathVariable Long id, @RequestBody MenuItem aggiornato) {
        MenuItem existing = menuItemRepository.findById(id)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Prodotto non trovato"));
        existing.setNome(aggiornato.getNome());
        existing.setDescrizione(aggiornato.getDescrizione());
        existing.setCategoria(aggiornato.getCategoria());
        existing.setPrezzo(aggiornato.getPrezzo());
        existing.setDisponibile(aggiornato.getDisponibile());
        existing.setImmagineUrl(aggiornato.getImmagineUrl());
        existing.setAllergeni(aggiornato.getAllergeni());
        return menuItemRepository.save(existing);
    }

    // DELETE /api/menu/{id}  (admin ristorante)
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void elimina(@PathVariable Long id) {
        menuItemRepository.deleteById(id);
    }
}
