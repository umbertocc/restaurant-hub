package com.example.restaurant.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;

@Entity
@Table(name = "configurazione_coperto")
public class CopertoConfig {

    @Id
    @Column(name = "ristorante_id")
    private Long ristoranteId;

    @Column(name = "prezzo_coperto", nullable = false)
    private BigDecimal prezzoCoperto;

    public Long getRistoranteId() { return ristoranteId; }
    public void setRistoranteId(Long ristoranteId) { this.ristoranteId = ristoranteId; }

    public BigDecimal getPrezzoCoperto() { return prezzoCoperto; }
    public void setPrezzoCoperto(BigDecimal prezzoCoperto) { this.prezzoCoperto = prezzoCoperto; }
}
