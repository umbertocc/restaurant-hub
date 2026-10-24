package com.example.restaurant.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "ordini")
public class Ordine {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "ristorante_id", nullable = false)
    private Long ristoranteId;

    @Column(name = "tavolo_id", nullable = false)
    private Long tavoloId;

    @Column(name = "prenotazione_id")
    private UUID prenotazioneId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Stato stato = Stato.APERTO;

    @Column(nullable = false)
    private BigDecimal totale = BigDecimal.ZERO;

    private String note;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    @Column(name = "chiuso_at")
    private OffsetDateTime chiusoAt;

    @OneToMany(mappedBy = "ordine", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrdineItem> items = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        createdAt = OffsetDateTime.now();
    }

    public enum Stato { APERTO, IN_PREPARAZIONE, SERVITO, CHIUSO, ANNULLATO }

    // Getters & Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public Long getRistoranteId() { return ristoranteId; }
    public void setRistoranteId(Long ristoranteId) { this.ristoranteId = ristoranteId; }

    public Long getTavoloId() { return tavoloId; }
    public void setTavoloId(Long tavoloId) { this.tavoloId = tavoloId; }

    public UUID getPrenotazioneId() { return prenotazioneId; }
    public void setPrenotazioneId(UUID prenotazioneId) { this.prenotazioneId = prenotazioneId; }

    public Stato getStato() { return stato; }
    public void setStato(Stato stato) { this.stato = stato; }

    public BigDecimal getTotale() { return totale; }
    public void setTotale(BigDecimal totale) { this.totale = totale; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public OffsetDateTime getChiusoAt() { return chiusoAt; }
    public void setChiusoAt(OffsetDateTime chiusoAt) { this.chiusoAt = chiusoAt; }

    public List<OrdineItem> getItems() { return items; }
    public void setItems(List<OrdineItem> items) { this.items = items; }
}
