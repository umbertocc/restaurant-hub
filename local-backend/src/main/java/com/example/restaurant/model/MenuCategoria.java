package com.example.restaurant.model;

import jakarta.persistence.*;

@Entity
@Table(name = "menu_categorie", uniqueConstraints = {
        @UniqueConstraint(name = "uk_menu_categorie_ristorante_nome", columnNames = {"ristorante_id", "nome"})
})
public class MenuCategoria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ristorante_id", nullable = false)
    private Long ristoranteId;

    @Column(nullable = false, length = 100)
    private String nome;

    @Column(length = 1000)
    private String descrizione;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Destinazione destinazione;

    public enum Destinazione { CUCINA, BAR, PIZZERIA }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getRistoranteId() { return ristoranteId; }
    public void setRistoranteId(Long ristoranteId) { this.ristoranteId = ristoranteId; }
    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
    public String getDescrizione() { return descrizione; }
    public void setDescrizione(String descrizione) { this.descrizione = descrizione; }
    public Destinazione getDestinazione() { return destinazione; }
    public void setDestinazione(Destinazione destinazione) { this.destinazione = destinazione; }
}
