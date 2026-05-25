package com.example.restaurant.repository;

import com.example.restaurant.model.RistoranteRuolo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface RistoranteRuoloRepository extends JpaRepository<RistoranteRuolo, Long> {
    @Query(value = "SELECT ruolo FROM restaurant.ristorante_ruoli WHERE ristorante_id = :ristoranteId", nativeQuery = true)
    List<String> findRuoliByRistoranteId(@Param("ristoranteId") Long ristoranteId);
}
