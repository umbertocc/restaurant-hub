package com.example.restaurant.model;

import jakarta.persistence.*;

@Entity
@Table(name = "abbinamenti")
public class Abbinamento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Piatto principale (es. branzino al forno)
    @Column(name = "piatto_id", nullable = false)
    private Long piattoId;

    // Bevanda/abbinamento consigliato (es. Vermentino)
    @Column(name = "abbinamento_item_id", nullable = false)
    private Long abbinamentoItemId;

    // Punteggio di affinità 1-100
    @Column(nullable = false)
    private Integer score = 80;

    @Enumerated(EnumType.STRING)
    private Tipo tipo;

    private String descrizione; // es. "Il Vermentino esalta la delicatezza del branzino"

    public enum Tipo { VINO, COCKTAIL, BIBITA, DESSERT }

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getPiattoId() { return piattoId; }
    public void setPiattoId(Long piattoId) { this.piattoId = piattoId; }

    public Long getAbbinamentoItemId() { return abbinamentoItemId; }
    public void setAbbinamentoItemId(Long abbinamentoItemId) { this.abbinamentoItemId = abbinamentoItemId; }

    public Integer getScore() { return score; }
    public void setScore(Integer score) { this.score = score; }

    public Tipo getTipo() { return tipo; }
    public void setTipo(Tipo tipo) { this.tipo = tipo; }

    public String getDescrizione() { return descrizione; }
    public void setDescrizione(String descrizione) { this.descrizione = descrizione; }
}
