package com.example.restaurant.service;

import com.example.restaurant.dto.PrenotazioneDTO;
import com.example.restaurant.model.Prenotazione;
import com.example.restaurant.repository.PrenotazioneRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
public class PrenotazioneService {

    private final PrenotazioneRepository prenotazioneRepository;

    public PrenotazioneService(PrenotazioneRepository prenotazioneRepository) {
        this.prenotazioneRepository = prenotazioneRepository;
    }

    public List<Prenotazione> getByRistorante(Long ristoranteId) {
        return prenotazioneRepository.findByRistoranteId(ristoranteId);
    }

    public Prenotazione getById(UUID id) {
        return prenotazioneRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Prenotazione non trovata"));
    }

    public Prenotazione crea(PrenotazioneDTO dto) {
        Prenotazione p = new Prenotazione();
        p.setRistoranteId(dto.getRistoranteId());
        p.setTavoloId(dto.getTavoloId());
        p.setClienteNome(dto.getClienteNome());
        p.setClienteEmail(dto.getClienteEmail());
        p.setClienteTelefono(dto.getClienteTelefono());
        p.setDataOra(dto.getDataOra());
        p.setCoperti(dto.getCoperti());
        p.setNote(dto.getNote());
        p.setStato(Prenotazione.Stato.IN_ATTESA);
        return prenotazioneRepository.save(p);
    }

    public Prenotazione aggiornaStato(UUID id, Prenotazione.Stato nuovoStato) {
        Prenotazione p = getById(id);
        p.setStato(nuovoStato);
        return prenotazioneRepository.save(p);
    }

    public void elimina(UUID id) {
        prenotazioneRepository.deleteById(id);
    }
}
