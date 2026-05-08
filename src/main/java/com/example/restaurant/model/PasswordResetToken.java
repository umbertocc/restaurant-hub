package com.example.restaurant.model;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "password_reset_tokens")
public class PasswordResetToken {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String token;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ristorante_id", nullable = false)
    private Ristorante ristorante;

    @Column(nullable = false)
    private OffsetDateTime expiryDate;

    public PasswordResetToken() {}

    public PasswordResetToken(String token, Ristorante ristorante, OffsetDateTime expiryDate) {
        this.token = token;
        this.ristorante = ristorante;
        this.expiryDate = expiryDate;
    }

    // Getter e Setter
    public Long getId() { return id; }
    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    public Ristorante getRistorante() { return ristorante; }
    public void setRistorante(Ristorante ristorante) { this.ristorante = ristorante; }
    public OffsetDateTime getExpiryDate() { return expiryDate; }
    public void setExpiryDate(OffsetDateTime expiryDate) { this.expiryDate = expiryDate; }
}
