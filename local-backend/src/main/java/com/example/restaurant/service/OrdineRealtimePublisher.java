package com.example.restaurant.service;

import com.example.restaurant.dto.OrdineRealtimeEvent;
import com.example.restaurant.model.Ordine;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
public class OrdineRealtimePublisher {

    private final SimpMessagingTemplate messagingTemplate;

    public OrdineRealtimePublisher(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void publishCreated(Ordine ordine) {
        publish("CREATED", ordine);
    }

    public void publishStatusUpdated(Ordine ordine) {
        publish("STATUS_UPDATED", ordine);
    }

    private void publish(String type, Ordine ordine) {
        if (ordine == null || ordine.getRistoranteId() == null || ordine.getId() == null) {
            return;
        }

        String topic = "/topic/ristorante." + ordine.getRistoranteId() + ".ordini";
        OrdineRealtimeEvent event = new OrdineRealtimeEvent(
                type,
                ordine.getId().toString(),
                ordine.getStato().name(),
                ordine.getRistoranteId(),
                Instant.now().toString()
        );
        messagingTemplate.convertAndSend(topic, event);
    }
}