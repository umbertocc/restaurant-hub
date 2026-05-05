package com.example.restaurant.service;

import com.example.restaurant.model.Abbinamento;
import com.example.restaurant.model.MenuItem;
import com.example.restaurant.repository.AbbinamentoRepository;
import com.example.restaurant.repository.MenuItemRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AbbinamentoService {

    private final AbbinamentoRepository abbinamentoRepository;
    private final MenuItemRepository menuItemRepository;

    public AbbinamentoService(AbbinamentoRepository abbinamentoRepository, MenuItemRepository menuItemRepository) {
        this.abbinamentoRepository = abbinamentoRepository;
        this.menuItemRepository = menuItemRepository;
    }

    public List<Abbinamento> getAbbinamenti(Long piattoId) {
        menuItemRepository.findById(piattoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Piatto non trovato"));
        return abbinamentoRepository.findByPiattoIdOrderByScoreDesc(piattoId);
    }

    public List<Abbinamento> getAbbinamentiPerTipo(Long piattoId, Abbinamento.Tipo tipo) {
        return abbinamentoRepository.findByPiattoIdAndTipoOrderByScoreDesc(piattoId, tipo);
    }

    public List<MenuItem> getSuggerimentiMenu(Long piattoId, MenuItemRepository menuRepo) {
        List<Abbinamento> abbinamenti = abbinamentoRepository.findByPiattoIdOrderByScoreDesc(piattoId);
        List<Long> ids = abbinamenti.stream()
                .map(Abbinamento::getAbbinamentoItemId)
                .collect(Collectors.toList());
        return menuRepo.findAllById(ids);
    }

    public Abbinamento crea(Abbinamento abbinamento) {
        return abbinamentoRepository.save(abbinamento);
    }

    public void elimina(Long id) {
        abbinamentoRepository.deleteById(id);
    }
}
