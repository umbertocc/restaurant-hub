package com.example.restaurant.service;

import com.example.restaurant.repository.DispositivoRistoranteRepository;
import org.springframework.stereotype.Service;

import java.util.concurrent.ConcurrentHashMap;
import java.util.Map;

/**
 * Verifica che un dispositivo attivato non sia stato bloccato o revocato.
 * Il risultato e' tenuto in cache per pochi secondi per non interrogare il DB a ogni richiesta.
 */
@Service
public class DispositivoAccessService {

    private static final long TTL_MS = 5_000L;

    private record Entry(boolean attivo, long scadenza) {}

    private final Map<Long, Entry> cache = new ConcurrentHashMap<>();
    private final DispositivoRistoranteRepository repository;

    public DispositivoAccessService(DispositivoRistoranteRepository repository) {
        this.repository = repository;
    }

    // dispositivoId null = token del login standard: nessun controllo
    public boolean isAttivo(Long dispositivoId, Long ristoranteId) {
        if (dispositivoId == null) return true;
        long ora = System.currentTimeMillis();
        Entry e = cache.get(dispositivoId);
        if (e == null || e.scadenza() < ora) {
            boolean attivo = repository.findByIdAndRistoranteId(dispositivoId, ristoranteId)
                    .map(d -> d.getRevokedAt() == null && d.getBloccatoAt() == null)
                    .orElse(false);
            e = new Entry(attivo, ora + TTL_MS);
            cache.put(dispositivoId, e);
        }
        return e.attivo();
    }

    public void invalida(Long dispositivoId) {
        cache.remove(dispositivoId);
    }
}
