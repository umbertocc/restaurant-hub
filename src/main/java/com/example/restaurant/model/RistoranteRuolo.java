package com.example.restaurant.model;

import jakarta.persistence.*;

@Entity
@Table(name = "ristorante_ruoli", schema = "restaurant")
public class RistoranteRuolo {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ristorante_id")
    private Long ristoranteId;

    @Column(name = "ruolo")
    private String ruolo;

    // Getters e setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getRistoranteId() { return ristoranteId; }
    public void setRistoranteId(Long ristoranteId) { this.ristoranteId = ristoranteId; }

    public String getRuolo() { return ruolo; }
    public void setRuolo(String ruolo) { this.ruolo = ruolo; }
}
