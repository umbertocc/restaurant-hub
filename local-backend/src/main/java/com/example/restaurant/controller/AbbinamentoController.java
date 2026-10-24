package com.example.restaurant.controller;

import com.example.restaurant.model.Abbinamento;
import com.example.restaurant.model.MenuItem;
import com.example.restaurant.repository.MenuItemRepository;
import com.example.restaurant.service.AbbinamentoService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/abbinamenti")
public class AbbinamentoController {

    private final AbbinamentoService abbinamentoService;
    private final MenuItemRepository menuItemRepository;

    public AbbinamentoController(AbbinamentoService abbinamentoService, MenuItemRepository menuItemRepository) {
        this.abbinamentoService = abbinamentoService;
        this.menuItemRepository = menuItemRepository;
    }

    // GET /api/abbinamenti?piattoId=5  — tutti gli abbinamenti per un piatto (pubblico)
    @GetMapping
    public List<Abbinamento> getAbbinamenti(@RequestParam Long piattoId,
                                             @RequestParam(required = false) Abbinamento.Tipo tipo) {
        if (tipo != null) {
            return abbinamentoService.getAbbinamentiPerTipo(piattoId, tipo);
        }
        return abbinamentoService.getAbbinamenti(piattoId);
    }

    // GET /api/abbinamenti/{piattoId}/suggerimenti  — ritorna i MenuItem abbinati
    @GetMapping("/{piattoId}/suggerimenti")
    public List<MenuItem> getSuggerimenti(@PathVariable Long piattoId) {
        return abbinamentoService.getSuggerimentiMenu(piattoId, menuItemRepository);
    }

    // POST /api/abbinamenti  (admin)
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Abbinamento crea(@RequestBody Abbinamento abbinamento) {
        return abbinamentoService.crea(abbinamento);
    }

    // DELETE /api/abbinamenti/{id}  (admin)
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void elimina(@PathVariable Long id) {
        abbinamentoService.elimina(id);
    }
}
