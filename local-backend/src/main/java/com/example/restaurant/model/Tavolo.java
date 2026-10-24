package com.example.restaurant.model;

import jakarta.persistence.*;

@Entity
@Table(name = "tavoli")
public class Tavolo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ristorante_id", nullable = false)
    private Long ristoranteId;

    @Column(nullable = false)
    private Integer numero;

    @Column(nullable = false)
    private Integer capacita;

    @Column(nullable = false)
    private Boolean disponibile = true;

    private String posizione; // es. "interno", "terrazza", "privato"

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getRistoranteId() { return ristoranteId; }
    public void setRistoranteId(Long ristoranteId) { this.ristoranteId = ristoranteId; }

    public Integer getNumero() { return numero; }
    public void setNumero(Integer numero) { this.numero = numero; }

    public Integer getCapacita() { return capacita; }
    public void setCapacita(Integer capacita) { this.capacita = capacita; }

    public Boolean getDisponibile() { return disponibile; }
    public void setDisponibile(Boolean disponibile) { this.disponibile = disponibile; }

    public String getPosizione() { return posizione; }
    public void setPosizione(String posizione) { this.posizione = posizione; }
}
