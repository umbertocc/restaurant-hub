package com.example.restaurant.repository;

import com.example.restaurant.model.Ordine;
import com.example.restaurant.model.Ordine.Stato;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OrdineRepository extends JpaRepository<Ordine, UUID> {
    @Override
    @EntityGraph(attributePaths = "items")
    Optional<Ordine> findById(UUID id);

    @EntityGraph(attributePaths = "items")
    List<Ordine> findByRistoranteId(Long ristoranteId);
    List<Ordine> findByTavoloIdAndStato(Long tavoloId, Stato stato);
    Optional<Ordine> findFirstByTavoloIdAndStato(Long tavoloId, Stato stato);
}
