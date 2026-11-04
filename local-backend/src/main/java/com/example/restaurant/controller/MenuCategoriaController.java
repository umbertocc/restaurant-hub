package com.example.restaurant.controller;

import com.example.restaurant.model.MenuCategoria;
import com.example.restaurant.repository.MenuCategoriaRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/menu/categorie")
public class MenuCategoriaController {

    private final MenuCategoriaRepository repository;

    public MenuCategoriaController(MenuCategoriaRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<MenuCategoria> getCategorie(@RequestParam Long ristoranteId) {
        return repository.findByRistoranteIdOrderByNome(ristoranteId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MenuCategoria crea(@RequestBody MenuCategoria categoria, HttpServletRequest request) {
        categoria.setId(null);
        categoria.setRistoranteId(ristoranteCorrente(request));
        valida(categoria);
        if (repository.existsByRistoranteIdAndNomeIgnoreCase(categoria.getRistoranteId(), categoria.getNome())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Esiste già una categoria con questo nome");
        }
        return repository.save(categoria);
    }

    @PutMapping("/{id}")
    public MenuCategoria aggiorna(@PathVariable Long id, @RequestBody MenuCategoria aggiornata,
                                  HttpServletRequest request) {
        Long ristoranteId = ristoranteCorrente(request);
        MenuCategoria categoria = repository.findByIdAndRistoranteId(id, ristoranteId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Categoria non trovata"));
        aggiornata.setRistoranteId(ristoranteId);
        valida(aggiornata);
        if (repository.existsByRistoranteIdAndNomeIgnoreCaseAndIdNot(ristoranteId, aggiornata.getNome(), id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Esiste già una categoria con questo nome");
        }
        categoria.setNome(aggiornata.getNome());
        categoria.setDescrizione(aggiornata.getDescrizione());
        categoria.setDestinazione(aggiornata.getDestinazione());
        return repository.save(categoria);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void elimina(@PathVariable Long id, HttpServletRequest request) {
        MenuCategoria categoria = repository.findByIdAndRistoranteId(id, ristoranteCorrente(request))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Categoria non trovata"));
        try {
            repository.delete(categoria);
            repository.flush();
        } catch (DataIntegrityViolationException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Sposta o elimina i piatti associati prima di eliminare la categoria");
        }
    }

    private static void valida(MenuCategoria categoria) {
        String nome = categoria.getNome() == null ? "" : categoria.getNome().trim();
        if (nome.isEmpty() || nome.length() > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Il nome deve contenere da 1 a 100 caratteri");
        }
        categoria.setNome(nome);
        if (categoria.getDescrizione() != null) {
            String descrizione = categoria.getDescrizione().trim();
            if (descrizione.length() > 1000) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La descrizione non può superare 1000 caratteri");
            }
            categoria.setDescrizione(descrizione.isEmpty() ? null : descrizione);
        }
        if (categoria.getDestinazione() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Seleziona una destinazione");
        }
    }

    private static Long ristoranteCorrente(HttpServletRequest request) {
        Long id = (Long) request.getAttribute("ristoranteId");
        if (id == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Utente non associato a un ristorante");
        }
        return id;
    }
}
