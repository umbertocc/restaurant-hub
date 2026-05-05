package com.example.restaurant.repository;

import com.example.restaurant.model.Ristorante;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface RistoranteRepository extends JpaRepository<Ristorante, Long> {
    Optional<Ristorante> findByEmail(String email);
    boolean existsByEmail(String email);
}
