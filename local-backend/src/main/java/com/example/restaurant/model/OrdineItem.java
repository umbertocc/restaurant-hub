package com.example.restaurant.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "ordine_items")
public class OrdineItem {

    @Id
    @GeneratedValue
    private UUID id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ordine_id", nullable = false)
    private Ordine ordine;

    @Column(name = "menu_item_id", nullable = false)
    private Long menuItemId;

    @Column(nullable = false)
    private Integer quantita;

    @Column(name = "prezzo_unitario", nullable = false)
    private BigDecimal prezzoUnitario;

    private String note;

    @Column(name = "nome_menu_item")
    private String nomeMenuItem;

    @Column(name = "categoria")
    private String categoria;

    // Getters & Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public Ordine getOrdine() { return ordine; }
    public void setOrdine(Ordine ordine) { this.ordine = ordine; }

    public Long getMenuItemId() { return menuItemId; }
    public void setMenuItemId(Long menuItemId) { this.menuItemId = menuItemId; }

    public Integer getQuantita() { return quantita; }
    public void setQuantita(Integer quantita) { this.quantita = quantita; }

    public BigDecimal getPrezzoUnitario() { return prezzoUnitario; }
    public void setPrezzoUnitario(BigDecimal prezzoUnitario) { this.prezzoUnitario = prezzoUnitario; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }

    public String getNomeMenuItem() { return nomeMenuItem; }
    public void setNomeMenuItem(String nomeMenuItem) { this.nomeMenuItem = nomeMenuItem; }

    public String getCategoria() { return categoria; }
    public void setCategoria(String categoria) { this.categoria = categoria; }

    public BigDecimal getSubtotale() {
        return prezzoUnitario.multiply(BigDecimal.valueOf(quantita));
    }
}
