package com.example.restaurant.repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface RistoranteRuoloRepository extends CrudRepository<Object[], Long> {
    @Query(value = "SELECT ruolo FROM restaurant.ristorante_ruoli WHERE ristorante_id = :ristoranteId", nativeQuery = true)
    List<String> findRuoliByRistoranteId(@Param("ristoranteId") Long ristoranteId);
}
