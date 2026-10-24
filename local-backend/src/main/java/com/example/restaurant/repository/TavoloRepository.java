package com.example.restaurant.repository;

import com.example.restaurant.model.Tavolo;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TavoloRepository extends JpaRepository<Tavolo, Long> {
    List<Tavolo> findByRistoranteId(Long ristoranteId);
    List<Tavolo> findByRistoranteIdAndDisponibile(Long ristoranteId, Boolean disponibile);
}
