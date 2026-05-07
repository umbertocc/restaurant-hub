package com.example.restaurant.model;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "menu_items")
public class MenuItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ristorante_id", nullable = false)
    private Long ristoranteId;

    @Column(nullable = false)
    private String nome;

    private String descrizione;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Categoria categoria;

    @Column(nullable = false)
    private BigDecimal prezzo;

    @Column(nullable = false)
    private Boolean disponibile = true;

    private String immagineUrl;

    private String allergeni;

    public enum Categoria {
        ANTIPASTO, PRIMO, SECONDO, CONTORNO, DESSERT,
        VINO_ROSSO, VINO_BIANCO, VINO_ROSE, COCKTAIL, BIBITA, ACQUA, PIZZA
    } 

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getRistoranteId() { return ristoranteId; }
    public void setRistoranteId(Long ristoranteId) { this.ristoranteId = ristoranteId; }

    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }

    public String getDescrizione() { return descrizione; }
    public void setDescrizione(String descrizione) { this.descrizione = descrizione; }

    public Categoria getCategoria() { return categoria; }
    public void setCategoria(Categoria categoria) { this.categoria = categoria; }

    public BigDecimal getPrezzo() { return prezzo; }
    public void setPrezzo(BigDecimal prezzo) { this.prezzo = prezzo; }

    public Boolean getDisponibile() { return disponibile; }
    public void setDisponibile(Boolean disponibile) { this.disponibile = disponibile; }

    public String getImmagineUrl() { return immagineUrl; }
    public void setImmagineUrl(String immagineUrl) { this.immagineUrl = immagineUrl; }

    public String getAllergeni() { return allergeni; }
    public void setAllergeni(String allergeni) { this.allergeni = allergeni; }
}
