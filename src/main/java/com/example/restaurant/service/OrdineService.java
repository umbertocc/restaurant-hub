package com.example.restaurant.service;

import com.example.restaurant.dto.OrdineDTO;
import com.example.restaurant.model.MenuItem;
import com.example.restaurant.model.Ordine;
import com.example.restaurant.model.OrdineItem;
import com.example.restaurant.repository.MenuItemRepository;
import com.example.restaurant.repository.OrdineRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
public class OrdineService {

    private final OrdineRepository ordineRepository;
    private final MenuItemRepository menuItemRepository;
    private final OrdineRealtimePublisher ordineRealtimePublisher;

    public OrdineService(OrdineRepository ordineRepository,
                         MenuItemRepository menuItemRepository,
                         OrdineRealtimePublisher ordineRealtimePublisher) {
        this.ordineRepository = ordineRepository;
        this.menuItemRepository = menuItemRepository;
        this.ordineRealtimePublisher = ordineRealtimePublisher;
    }

    @Transactional
    public Ordine crea(OrdineDTO dto) {
        Ordine ordine = new Ordine();
        ordine.setRistoranteId(dto.getRistoranteId());
        ordine.setTavoloId(dto.getTavoloId());
        ordine.setPrenotazioneId(dto.getPrenotazioneId());
        ordine.setNote(dto.getNote());

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
            item.setCategoria(menuItem.getCategoria().name());

            ordine.getItems().add(item);
            totale = totale.add(item.getSubtotale());
        }

        ordine.setTotale(totale);
        Ordine saved = ordineRepository.save(ordine);
        ordineRealtimePublisher.publishCreated(saved);
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
        Ordine ordine = getById(id);
        ordine.setStato(nuovoStato);
        Ordine saved = ordineRepository.save(ordine);
        ordineRealtimePublisher.publishStatusUpdated(saved);
        return saved;
    }
}
