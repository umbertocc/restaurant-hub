package com.example.restaurant.model;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "prenotazioni")
public class Prenotazione {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "ristorante_id", nullable = false)
    private Long ristoranteId;

    @Column(name = "tavolo_id")
    private Long tavoloId;

    @Column(name = "cliente_nome", nullable = false)
    private String clienteNome;

    @Column(name = "cliente_email")
    private String clienteEmail;

    @Column(name = "cliente_telefono")
    private String clienteTelefono;

    @Column(name = "data_ora", nullable = false)
    private OffsetDateTime dataOra;

    @Column(nullable = false)
    private Integer coperti;

    private String note;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Stato stato = Stato.IN_ATTESA;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = OffsetDateTime.now();
    }

    public enum Stato { IN_ATTESA, CONFERMATA, ANNULLATA, COMPLETATA }

    // Getters & Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public Long getRistoranteId() { return ristoranteId; }
    public void setRistoranteId(Long ristoranteId) { this.ristoranteId = ristoranteId; }

    public Long getTavoloId() { return tavoloId; }
    public void setTavoloId(Long tavoloId) { this.tavoloId = tavoloId; }

    public String getClienteNome() { return clienteNome; }
    public void setClienteNome(String clienteNome) { this.clienteNome = clienteNome; }

    public String getClienteEmail() { return clienteEmail; }
    public void setClienteEmail(String clienteEmail) { this.clienteEmail = clienteEmail; }

    public String getClienteTelefono() { return clienteTelefono; }
    public void setClienteTelefono(String clienteTelefono) { this.clienteTelefono = clienteTelefono; }

    public OffsetDateTime getDataOra() { return dataOra; }
    public void setDataOra(OffsetDateTime dataOra) { this.dataOra = dataOra; }

    public Integer getCoperti() { return coperti; }
    public void setCoperti(Integer coperti) { this.coperti = coperti; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }

    public Stato getStato() { return stato; }
    public void setStato(Stato stato) { this.stato = stato; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
