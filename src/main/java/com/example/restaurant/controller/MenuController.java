package com.example.restaurant.controller;

import com.example.restaurant.model.MenuItem;
import com.example.restaurant.model.MenuCategoria;
import com.example.restaurant.repository.MenuCategoriaRepository;
import com.example.restaurant.repository.MenuItemRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/menu")
public class MenuController {

    private final MenuItemRepository menuItemRepository;
    private final MenuCategoriaRepository categoriaRepository;

    public MenuController(MenuItemRepository menuItemRepository, MenuCategoriaRepository categoriaRepository) {
        this.menuItemRepository = menuItemRepository;
        this.categoriaRepository = categoriaRepository;
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
    public MenuItem crea(@RequestBody MenuItem menuItem, HttpServletRequest request) {
        Long ristoranteId = (Long) request.getAttribute("ristoranteId");
        menuItem.setRistoranteId(ristoranteId);
        menuItem.setCategoria(categoriaPerRistorante(menuItem.getCategoria(), ristoranteId));
        return menuItemRepository.save(menuItem);
    }

    // PUT /api/menu/{id}  (admin ristorante)
    @PutMapping("/{id}")
    public MenuItem aggiorna(@PathVariable Long id, @RequestBody MenuItem aggiornato, HttpServletRequest request) {
        Long ristoranteId = (Long) request.getAttribute("ristoranteId");
        MenuItem existing = menuItemRepository.findById(id)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Prodotto non trovato"));
        if (!existing.getRistoranteId().equals(ristoranteId)) {
            throw new org.springframework.web.server.ResponseStatusException(HttpStatus.NOT_FOUND, "Prodotto non trovato");
        }
        if (aggiornato.getNome() != null) existing.setNome(aggiornato.getNome());
        if (aggiornato.getDescrizione() != null) existing.setDescrizione(aggiornato.getDescrizione());
        if (aggiornato.getCategoria() != null) {
            existing.setCategoria(categoriaPerRistorante(aggiornato.getCategoria(), ristoranteId));
        }
        if (aggiornato.getPrezzo() != null) existing.setPrezzo(aggiornato.getPrezzo());
        if (aggiornato.getDisponibile() != null) existing.setDisponibile(aggiornato.getDisponibile());
        if (aggiornato.getImmagineUrl() != null) existing.setImmagineUrl(aggiornato.getImmagineUrl());
        if (aggiornato.getAllergeni() != null) existing.setAllergeni(aggiornato.getAllergeni());
        return menuItemRepository.save(existing);
    }

    // DELETE /api/menu/{id}  (admin ristorante)
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void elimina(@PathVariable Long id, HttpServletRequest request) {
        MenuItem item = menuItemRepository.findById(id)
                .filter(m -> m.getRistoranteId().equals(request.getAttribute("ristoranteId")))
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(HttpStatus.NOT_FOUND, "Prodotto non trovato"));
        menuItemRepository.delete(item);
    }

    private MenuCategoria categoriaPerRistorante(MenuCategoria richiesta, Long ristoranteId) {
        if (richiesta == null || richiesta.getId() == null || ristoranteId == null) {
            throw new org.springframework.web.server.ResponseStatusException(HttpStatus.BAD_REQUEST, "Categoria non valida");
        }
        return categoriaRepository.findByIdAndRistoranteId(richiesta.getId(), ristoranteId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "La categoria non appartiene a questo ristorante"));
    }
}
