package com.example.restaurant.dto;

import com.example.restaurant.model.MenuItem.Categoria;

import java.math.BigDecimal;
import java.util.List;

/** Dati esposti senza autenticazione: nessun campo riservato (email, billing, ecc.). */
public record PublicSitoDTO(
        Long ristoranteId,
        String nome,
        String descrizione,
        String indirizzo,
        String citta,
        String telefono,
        String orari,
        String logoUrl,
        String copertinaUrl,
        String instagramUrl,
        String facebookUrl,
        List<Voce> menu) {

    public record Voce(
            Long id,
            String nome,
            String descrizione,
            Categoria categoria,
            BigDecimal prezzo,
            String immagineUrl,
            String allergeni) {
    }
}
