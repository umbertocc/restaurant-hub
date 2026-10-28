package com.example.restaurant.controller;

import com.example.restaurant.dto.PublicSitoDTO;
import com.example.restaurant.dto.SitoConfigDTO;
import com.example.restaurant.model.Ristorante;
import com.example.restaurant.repository.MenuItemRepository;
import com.example.restaurant.repository.RistoranteRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api")
public class SitoController {

    private static final Pattern SLUG = Pattern.compile("^[a-z0-9]+(-[a-z0-9]+)*$");
    private static final int SLUG_MIN = 3;
    private static final int SLUG_MAX = 50;
    private static final int URL_MAX = 500;
    private static final int DESCRIZIONE_MAX = 2000;
    private static final int ORARI_MAX = 1000;

    private final RistoranteRepository ristoranteRepository;
    private final MenuItemRepository menuItemRepository;

    public SitoController(RistoranteRepository ristoranteRepository,
                          MenuItemRepository menuItemRepository) {
        this.ristoranteRepository = ristoranteRepository;
        this.menuItemRepository = menuItemRepository;
    }

    // GET /api/public/sito/{slug}  (pubblico)
    @GetMapping("/public/sito/{slug}")
    public PublicSitoDTO getPubblico(@PathVariable String slug) {
        Ristorante r = ristoranteRepository.findBySlug(slug.toLowerCase(Locale.ROOT))
                .filter(x -> Boolean.TRUE.equals(x.getSitoPubblicato()) && Boolean.TRUE.equals(x.getAttivo()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sito non trovato"));

        List<PublicSitoDTO.Voce> menu = menuItemRepository.findByRistoranteIdAndDisponibile(r.getId(), true)
                .stream()
                .map(m -> new PublicSitoDTO.Voce(m.getId(), m.getNome(), m.getDescrizione(),
                        m.getCategoria(), m.getPrezzo(), m.getImmagineUrl(), m.getAllergeni()))
                .toList();

        return new PublicSitoDTO(r.getId(), r.getNome(), r.getDescrizione(), r.getIndirizzo(),
                r.getCitta(), r.getTelefono(), r.getOrari(), r.getLogoUrl(), r.getCopertinaUrl(),
                r.getInstagramUrl(), r.getFacebookUrl(), menu);
    }

    // GET /api/sito  (ristoratore autenticato)
    @GetMapping("/sito")
    public SitoConfigDTO getConfig(HttpServletRequest request) {
        return toConfig(corrente(request));
    }

    // PUT /api/sito  (ristoratore autenticato)
    @PutMapping("/sito")
    public SitoConfigDTO aggiornaConfig(@RequestBody SitoConfigDTO body, HttpServletRequest request) {
        Ristorante r = corrente(request);

        String slug = blankToNull(body.slug());
        if (slug != null) {
            slug = slug.toLowerCase(Locale.ROOT);
            if (slug.length() < SLUG_MIN || slug.length() > SLUG_MAX || !SLUG.matcher(slug).matches()) {
                throw bad("L'indirizzo deve avere da 3 a 50 caratteri: lettere minuscole, numeri e trattini (es. da-mario)");
            }
            if (ristoranteRepository.existsBySlugAndIdNot(slug, r.getId())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Indirizzo già in uso, scegline un altro");
            }
        }
        boolean pubblicato = Boolean.TRUE.equals(body.sitoPubblicato());
        if (pubblicato && slug == null) {
            throw bad("Per pubblicare il sito devi scegliere un indirizzo");
        }

        r.setSlug(slug);
        r.setDescrizione(limitata(body.descrizione(), DESCRIZIONE_MAX, "Descrizione troppo lunga"));
        r.setOrari(limitata(body.orari(), ORARI_MAX, "Orari troppo lunghi"));
        r.setCopertinaUrl(urlOrNull(body.copertinaUrl(), "Immagine di copertina"));
        r.setInstagramUrl(urlOrNull(body.instagramUrl(), "Link Instagram"));
        r.setFacebookUrl(urlOrNull(body.facebookUrl(), "Link Facebook"));
        r.setSitoPubblicato(pubblicato);

        try {
            return toConfig(ristoranteRepository.saveAndFlush(r));
        } catch (DataIntegrityViolationException e) {
            // Due salvataggi concorrenti con lo stesso slug: l'indice univoco ha l'ultima parola.
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Indirizzo già in uso, scegline un altro");
        }
    }

    private Ristorante corrente(HttpServletRequest request) {
        Long id = (Long) request.getAttribute("ristoranteId");
        if (id == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Utente non associato a un ristorante");
        }
        return ristoranteRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ristorante non trovato"));
    }

    private static SitoConfigDTO toConfig(Ristorante r) {
        return new SitoConfigDTO(r.getSlug(), r.getDescrizione(), r.getOrari(), r.getCopertinaUrl(),
                r.getInstagramUrl(), r.getFacebookUrl(), r.getSitoPubblicato());
    }

    private static String blankToNull(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }

    private static String limitata(String s, int max, String errore) {
        String t = blankToNull(s);
        if (t != null && t.length() > max) throw bad(errore);
        return t;
    }

    // Solo http(s): evita URL tipo javascript: che finirebbero in href/src della pagina pubblica.
    private static String urlOrNull(String s, String campo) {
        String t = blankToNull(s);
        if (t == null) return null;
        String lower = t.toLowerCase(Locale.ROOT);
        if (t.length() > URL_MAX || !(lower.startsWith("https://") || lower.startsWith("http://"))) {
            throw bad(campo + ": inserisci un URL valido che inizi con https://");
        }
        return t;
    }

    private static ResponseStatusException bad(String msg) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, msg);
    }
}
