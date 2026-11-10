package com.example.restaurant.service;

import com.example.restaurant.dto.OrdineDTO;
import com.example.restaurant.model.MenuItem;
import com.example.restaurant.model.Ordine;
import com.example.restaurant.model.OrdineItem;
import com.example.restaurant.model.Ristorante;
import com.example.restaurant.repository.MenuItemRepository;
import com.example.restaurant.repository.OrdineRepository;
import com.example.restaurant.repository.RistoranteRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class OrdineService {

    private final OrdineRepository ordineRepository;
    private final MenuItemRepository menuItemRepository;
    private final RistoranteRepository ristoranteRepository;
    private final OrdineRealtimePublisher ordineRealtimePublisher;

    public OrdineService(OrdineRepository ordineRepository,
                         MenuItemRepository menuItemRepository,
                         RistoranteRepository ristoranteRepository,
                         OrdineRealtimePublisher ordineRealtimePublisher) {
        this.ordineRepository = ordineRepository;
        this.menuItemRepository = menuItemRepository;
        this.ristoranteRepository = ristoranteRepository;
        this.ordineRealtimePublisher = ordineRealtimePublisher;
    }

    @Transactional
    public Ordine crea(OrdineDTO dto) {
        Ordine ordine = new Ordine();
        ordine.setRistoranteId(dto.getRistoranteId());
        ordine.setTavoloId(dto.getTavoloId());
        ordine.setPrenotazioneId(dto.getPrenotazioneId());
        ordine.setNote(dto.getNote());
        ordine.setCoperti(dto.getCoperti());
        BigDecimal prezzoCoperto = ristoranteRepository.findById(dto.getRistoranteId())
                .map(Ristorante::getPrezzoCoperto)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ristorante non trovato"));
        ordine.setPrezzoCoperto(prezzoCoperto);

        BigDecimal totale = BigDecimal.ZERO;

        for (OrdineDTO.OrdineItemDTO itemDto : dto.getItems()) {
            MenuItem menuItem = menuItemRepository.findById(itemDto.getMenuItemId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                            "MenuItem non trovato: " + itemDto.getMenuItemId()));

            if (!menuItem.getDisponibile()) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Prodotto non disponibile: " + menuItem.getNome());
            }

            OrdineItem item = new OrdineItem();
            item.setOrdine(ordine);
            item.setMenuItemId(menuItem.getId());
            item.setQuantita(itemDto.getQuantita());
            item.setPrezzoUnitario(menuItem.getPrezzo());
            item.setNote(itemDto.getNote());
            item.setNomeMenuItem(menuItem.getNome());
            item.setCategoria(menuItem.getCategoria().getNome());
            item.setDestinazione(menuItem.getCategoria().getDestinazione().name());

            ordine.getItems().add(item);
            totale = totale.add(item.getSubtotale());
        }

        ordine.setTotale(totale.add(prezzoCoperto.multiply(BigDecimal.valueOf(dto.getCoperti()))));
        Ordine saved = ordineRepository.save(ordine);
        ordineRealtimePublisher.publishCreated(saved);
        return saved;
    }

    @Transactional
    public Ordine aggiorna(UUID id, Long ristoranteId, OrdineDTO dto) {
        Ordine ordine = getById(id);
        if (!ordine.getRistoranteId().equals(ristoranteId)
                || !ordine.getRistoranteId().equals(dto.getRistoranteId())
                || !ordine.getTavoloId().equals(dto.getTavoloId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Ordine non trovato");
        }
        if (ordine.getStato() == Ordine.Stato.CHIUSO
                || ordine.getStato() == Ordine.Stato.PAGATO
                || ordine.getStato() == Ordine.Stato.ANNULLATO) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "L'ordine non è più modificabile");
        }

        Set<Long> itemGiaPresenti = ordine.getItems().stream()
                .map(OrdineItem::getMenuItemId)
                .collect(Collectors.toSet());
        ordine.getItems().clear();
        BigDecimal totale = BigDecimal.ZERO;

        for (OrdineDTO.OrdineItemDTO itemDto : dto.getItems()) {
            MenuItem menuItem = menuItemRepository.findById(itemDto.getMenuItemId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                            "MenuItem non trovato: " + itemDto.getMenuItemId()));
            if (!menuItem.getRistoranteId().equals(ristoranteId)) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "MenuItem non trovato: " + itemDto.getMenuItemId());
            }
            if (!menuItem.getDisponibile() && !itemGiaPresenti.contains(menuItem.getId())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Prodotto non disponibile: " + menuItem.getNome());
            }

            OrdineItem item = new OrdineItem();
            item.setOrdine(ordine);
            item.setMenuItemId(menuItem.getId());
            item.setQuantita(itemDto.getQuantita());
            item.setPrezzoUnitario(menuItem.getPrezzo());
            item.setNote(itemDto.getNote());
            item.setNomeMenuItem(menuItem.getNome());
            item.setCategoria(menuItem.getCategoria().getNome());
            item.setDestinazione(menuItem.getCategoria().getDestinazione().name());
            ordine.getItems().add(item);
            totale = totale.add(item.getSubtotale());
        }

        ordine.setCoperti(dto.getCoperti());
        ordine.setNote(dto.getNote());
        ordine.setTotale(totale.add(ordine.getPrezzoCoperto()
                .multiply(BigDecimal.valueOf(dto.getCoperti()))));
        Ordine saved = ordineRepository.save(ordine);
        ordineRealtimePublisher.publishOrderUpdated(saved);
        return saved;
    }

    @Transactional(readOnly = true)
    public Ordine getById(UUID id) {
        return ordineRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ordine non trovato"));
    }

    @Transactional(readOnly = true)
    public List<Ordine> getByRistorante(Long ristoranteId) {
        return ordineRepository.findByRistoranteId(ristoranteId);
    }

    @Transactional
    public Ordine aggiornaStato(UUID id, Ordine.Stato nuovoStato) {
        if (nuovoStato == Ordine.Stato.PAGATO) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Per chiudere il tavolo usa l'azione dedicata");
        }
        Ordine ordine = getById(id);
        ordine.setStato(nuovoStato);
        Ordine saved = ordineRepository.save(ordine);
        ordineRealtimePublisher.publishStatusUpdated(saved);
        return saved;
    }

    @Transactional
    public List<Ordine> chiudiTavolo(Long tavoloId, Long ristoranteId) {
        List<Ordine> seduta = ordineRepository.findByRistoranteIdAndTavoloIdAndStatoIn(
                ristoranteId, tavoloId,
                List.of(Ordine.Stato.APERTO, Ordine.Stato.IN_PREPARAZIONE,
                        Ordine.Stato.SERVITO, Ordine.Stato.CHIUSO));
        if (seduta.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Nessun ordine da chiudere per il tavolo");
        }
        if (seduta.stream().anyMatch(o -> o.getStato() != Ordine.Stato.CHIUSO)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Il tavolo può essere chiuso solo dopo la consegna di tutti gli ordini");
        }
        seduta.forEach(o -> o.setStato(Ordine.Stato.PAGATO));
        List<Ordine> saved = ordineRepository.saveAll(seduta);
        saved.forEach(ordineRealtimePublisher::publishStatusUpdated);
        return saved;
    }
}
