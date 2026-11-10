package com.example.restaurant.service;

import com.example.restaurant.model.Ordine;
import com.example.restaurant.model.OrdineItem;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class OrdineServiceTest {

    @Test
    void aggregateRemainsOpenUntilPreparationStarts() {
        assertEquals(Ordine.Stato.APERTO, aggregate(OrdineItem.Stato.APERTO));
        assertEquals(Ordine.Stato.IN_PREPARAZIONE,
                OrdineService.statoAggregato(List.of(item(OrdineItem.Stato.APERTO), item(OrdineItem.Stato.PRONTO))));
    }

    @Test
    void orderIsReadyOnlyWhenEveryItemIsReadyOrDelivered() {
        assertEquals(Ordine.Stato.IN_PREPARAZIONE,
                OrdineService.statoAggregato(List.of(
                        item(OrdineItem.Stato.IN_PREPARAZIONE),
                        item(OrdineItem.Stato.PRONTO)
                )));
        assertEquals(Ordine.Stato.PRONTO,
                OrdineService.statoAggregato(List.of(
                        item(OrdineItem.Stato.PRONTO),
                        item(OrdineItem.Stato.CONSEGNATO)
                )));
    }

    @Test
    void orderIsDeliveredOnlyWhenEveryItemHasBeenDelivered() {
        assertEquals(Ordine.Stato.PRONTO,
                OrdineService.statoAggregato(List.of(
                        item(OrdineItem.Stato.CONSEGNATO),
                        item(OrdineItem.Stato.PRONTO)
                )));
        assertEquals(Ordine.Stato.CONSEGNATO,
                OrdineService.statoAggregato(List.of(
                        item(OrdineItem.Stato.CONSEGNATO),
                        item(OrdineItem.Stato.CONSEGNATO)
                )));
    }

    private Ordine.Stato aggregate(OrdineItem.Stato state) {
        return OrdineService.statoAggregato(List.of(item(state)));
    }

    private OrdineItem item(OrdineItem.Stato state) {
        OrdineItem item = new OrdineItem();
        item.setStato(state);
        return item;
    }
}
