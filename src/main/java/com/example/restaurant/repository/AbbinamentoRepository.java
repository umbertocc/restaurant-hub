package com.example.restaurant.repository;

import com.example.restaurant.model.Abbinamento;
import com.example.restaurant.model.Abbinamento.Tipo;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AbbinamentoRepository extends JpaRepository<Abbinamento, Long> {
    List<Abbinamento> findByPiattoIdOrderByScoreDesc(Long piattoId);
    List<Abbinamento> findByPiattoIdAndTipoOrderByScoreDesc(Long piattoId, Tipo tipo);
}
