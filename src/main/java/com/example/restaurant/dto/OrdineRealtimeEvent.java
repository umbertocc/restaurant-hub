package com.example.restaurant.dto;

public record OrdineRealtimeEvent(
        String type,
        String ordineId,
        String stato,
        Long ristoranteId,
        String timestamp
) {
}