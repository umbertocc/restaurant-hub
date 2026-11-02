package com.example.restaurant.model;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "dispositivi_ristorante")
public class DispositivoRistorante {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ristorante_id", nullable = false)
    private Long ristoranteId;

    @Column(nullable = false)
    private String nome;

    @Column(nullable = false)
    private String ruolo;

    @Column(name = "codice_hash", nullable = false, unique = true)
    private String codiceHash;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "last_used_at")
    private OffsetDateTime lastUsedAt;

    @Column(name = "revoked_at")
    private OffsetDateTime revokedAt;

    @Column(name = "bloccato_at")
    private OffsetDateTime bloccatoAt;

    @Column(name = "bloccato_da")
    private String bloccatoDa;

    public OffsetDateTime getBloccatoAt() { return bloccatoAt; }
    public void setBloccatoAt(OffsetDateTime bloccatoAt) { this.bloccatoAt = bloccatoAt; }

    public String getBloccatoDa() { return bloccatoDa; }
    public void setBloccatoDa(String bloccatoDa) { this.bloccatoDa = bloccatoDa; }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getRistoranteId() { return ristoranteId; }
    public void setRistoranteId(Long ristoranteId) { this.ristoranteId = ristoranteId; }

    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }

    public String getRuolo() { return ruolo; }
    public void setRuolo(String ruolo) { this.ruolo = ruolo; }

    public String getCodiceHash() { return codiceHash; }
    public void setCodiceHash(String codiceHash) { this.codiceHash = codiceHash; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public OffsetDateTime getLastUsedAt() { return lastUsedAt; }
    public void setLastUsedAt(OffsetDateTime lastUsedAt) { this.lastUsedAt = lastUsedAt; }

    public OffsetDateTime getRevokedAt() { return revokedAt; }
    public void setRevokedAt(OffsetDateTime revokedAt) { this.revokedAt = revokedAt; }
}
