package com.example.restaurant.print;

import com.example.restaurant.model.Ordine;
import com.example.restaurant.model.OrdineItem;
import com.example.restaurant.repository.TavoloRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.nio.charset.Charset;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Stampa le comande su stampanti Epson ESC/POS in rete (TCP 9100), una per reparto.
 * Pizza -> pizzeria; cocktail, bibite, vini, acqua -> bar; tutto il resto -> cucina.
 */
@Service
public class PrintService {

    private enum Reparto { BAR, CUCINA, PIZZERIA }

    private static final Logger log = LoggerFactory.getLogger(PrintService.class);
    private static final int DEFAULT_PORT = 9100;

    private final boolean enabled;
    private final Map<Reparto, String> printers = new EnumMap<>(Reparto.class);
    private final int columns;
    private final Charset charset;
    private final TavoloRepository tavoloRepository;
    private final ExecutorService executor = Executors.newFixedThreadPool(3);

    public PrintService(@Value("${app.print.enabled:false}") boolean enabled,
                        @Value("${app.print.bar:}") String bar,
                        @Value("${app.print.cucina:}") String cucina,
                        @Value("${app.print.pizzeria:}") String pizzeria,
                        @Value("${app.print.columns:42}") int columns,
                        TavoloRepository tavoloRepository) {
        this.enabled = enabled;
        printers.put(Reparto.BAR, bar.trim());
        printers.put(Reparto.CUCINA, cucina.trim());
        printers.put(Reparto.PIZZERIA, pizzeria.trim());
        this.columns = columns;
        this.tavoloRepository = tavoloRepository;
        Charset cs;
        try {
            cs = Charset.forName("Cp858");
        } catch (Exception e) {
            cs = Charset.forName("ISO-8859-1");
        }
        this.charset = cs;
    }

    /** Da chiamare dentro la transazione di creazione: costruisce le comande e le invia in background. */
    public void printNewOrder(Ordine ordine) {
        if (!enabled) {
            return;
        }
        try {
            String tavolo = ordine.getTavoloId() == null ? "-" : tavoloRepository.findById(ordine.getTavoloId())
                    .map(t -> String.valueOf(t.getNumero())).orElse(String.valueOf(ordine.getTavoloId()));

            Map<Reparto, List<OrdineItem>> perReparto = new EnumMap<>(Reparto.class);
            for (OrdineItem item : ordine.getItems()) {
                perReparto.computeIfAbsent(repartoDi(item.getCategoria()), r -> new ArrayList<>()).add(item);
            }
            perReparto.forEach((reparto, items) -> {
                String target = printers.get(reparto);
                if (target == null || target.isBlank()) {
                    log.warn("Stampante {} non configurata: comanda non stampata", reparto);
                    return;
                }
                byte[] data = buildTicket(reparto, tavolo, ordine, items);
                executor.submit(() -> send(reparto, target, data));
            });
        } catch (Exception e) {
            log.error("Errore preparazione comanda per ordine {}", ordine.getId(), e);
        }
    }

    private Reparto repartoDi(String categoria) {
        if (categoria == null) {
            return Reparto.CUCINA;
        }
        if ("PIZZA".equals(categoria)) {
            return Reparto.PIZZERIA;
        }
        if (categoria.equals("COCKTAIL") || categoria.equals("BIBITA") || categoria.equals("ACQUA")
                || categoria.startsWith("VINO_")) {
            return Reparto.BAR;
        }
        return Reparto.CUCINA;
    }

    private byte[] buildTicket(Reparto reparto, String tavolo, Ordine ordine, List<OrdineItem> items) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        write(out, new byte[]{0x1B, 0x40});            // init
        write(out, new byte[]{0x1B, 0x74, 0x13});      // code page CP858
        write(out, new byte[]{0x1B, 0x61, 0x01});      // centro
        write(out, new byte[]{0x1D, 0x21, 0x11});      // doppia dimensione
        text(out, reparto.name() + "\n");
        text(out, "TAVOLO " + tavolo + "\n");
        write(out, new byte[]{0x1D, 0x21, 0x00});
        text(out, OffsetDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")) + "\n");
        write(out, new byte[]{0x1B, 0x61, 0x00});      // sinistra
        text(out, "-".repeat(columns) + "\n");
        for (OrdineItem item : items) {
            write(out, new byte[]{0x1D, 0x21, 0x01});  // doppia altezza
            text(out, item.getQuantita() + " x " + item.getNomeMenuItem() + "\n");
            write(out, new byte[]{0x1D, 0x21, 0x00});
            if (item.getNote() != null && !item.getNote().isBlank()) {
                text(out, "   > " + item.getNote() + "\n");
            }
        }
        if (ordine.getNote() != null && !ordine.getNote().isBlank()) {
            text(out, "-".repeat(columns) + "\n");
            text(out, "NOTE: " + ordine.getNote() + "\n");
        }
        text(out, "\n\n\n");
        write(out, new byte[]{0x1D, 0x56, 0x42, 0x00}); // taglio
        return out.toByteArray();
    }

    private void text(ByteArrayOutputStream out, String s) {
        write(out, s.getBytes(charset));
    }

    private void write(ByteArrayOutputStream out, byte[] bytes) {
        out.writeBytes(bytes);
    }

    private void send(Reparto reparto, String target, byte[] data) {
        String host = target;
        int port = DEFAULT_PORT;
        int idx = target.lastIndexOf(':');
        if (idx > 0) {
            host = target.substring(0, idx);
            port = Integer.parseInt(target.substring(idx + 1));
        }
        try (Socket socket = new Socket()) {
            socket.connect(new InetSocketAddress(host, port), 3000);
            socket.getOutputStream().write(data);
            socket.getOutputStream().flush();
        } catch (IOException e) {
            log.error("Stampa {} fallita su {}: {}", reparto, target, e.getMessage());
        }
    }
}
