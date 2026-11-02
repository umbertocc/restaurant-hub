package com.example.restaurant.repository;

import com.example.restaurant.model.DispositivoRistorante;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DispositivoRistoranteRepository extends JpaRepository<DispositivoRistorante, Long> {
    List<DispositivoRistorante> findByRistoranteIdOrderByCreatedAtDesc(Long ristoranteId);

    Optional<DispositivoRistorante> findByRistoranteIdAndCodiceHashAndRevokedAtIsNull(Long ristoranteId, String codiceHash);

    Optional<DispositivoRistorante> findByIdAndRistoranteId(Long id, Long ristoranteId);
}
