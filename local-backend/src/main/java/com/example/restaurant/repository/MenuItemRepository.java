package com.example.restaurant.repository;

import com.example.restaurant.model.MenuItem;
import com.example.restaurant.model.MenuItem.Categoria;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MenuItemRepository extends JpaRepository<MenuItem, Long> {
    List<MenuItem> findByRistoranteId(Long ristoranteId);
    List<MenuItem> findByRistoranteIdAndDisponibile(Long ristoranteId, Boolean disponibile);
    List<MenuItem> findByRistoranteIdAndCategoria(Long ristoranteId, Categoria categoria);
}
