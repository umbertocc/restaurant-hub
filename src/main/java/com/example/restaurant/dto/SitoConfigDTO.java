package com.example.restaurant.dto;

/** Configurazione del sito pubblico, usata sia in lettura che in scrittura dal ristoratore. */
public record SitoConfigDTO(
        String slug,
        String descrizione,
        String orari,
        String copertinaUrl,
        String instagramUrl,
        String facebookUrl,
        Boolean sitoPubblicato) {
}
