package com.example.restaurant.repository;

import com.example.restaurant.model.MenuCategoria;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MenuCategoriaRepository extends JpaRepository<MenuCategoria, Long> {
    List<MenuCategoria> findByRistoranteIdOrderByNome(Long ristoranteId);
    Optional<MenuCategoria> findByIdAndRistoranteId(Long id, Long ristoranteId);
    boolean existsByRistoranteIdAndNomeIgnoreCaseAndIdNot(Long ristoranteId, String nome, Long id);
    boolean existsByRistoranteIdAndNomeIgnoreCase(Long ristoranteId, String nome);
}
