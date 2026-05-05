package com.example.restaurant.repository;

import com.example.restaurant.model.Prenotazione;
import com.example.restaurant.model.Prenotazione.Stato;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public interface PrenotazioneRepository extends JpaRepository<Prenotazione, UUID> {
    List<Prenotazione> findByRistoranteId(Long ristoranteId);
    List<Prenotazione> findByRistoranteIdAndStato(Long ristoranteId, Stato stato);
    List<Prenotazione> findByRistoranteIdAndDataOraBetween(Long ristoranteId, OffsetDateTime from, OffsetDateTime to);
    List<Prenotazione> findByTavoloIdAndDataOraBetween(Long tavoloId, OffsetDateTime from, OffsetDateTime to);
}
