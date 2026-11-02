package com.example.restaurant.controller;

import com.example.restaurant.model.DispositivoRistorante;
import com.example.restaurant.model.Ristorante;
import com.example.restaurant.repository.DispositivoRistoranteRepository;
import com.example.restaurant.repository.RistoranteRepository;
import com.example.restaurant.repository.RistoranteRuoloRepository;
import com.example.restaurant.service.DispositivoAccessService;
import com.example.restaurant.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api")
public class DispositivoController {

    private static final Set<String> RUOLI = Set.of("admin", "cameriere", "cuoco", "barista", "pizzaiolo");
    // Alfabeto senza caratteri ambigui (0/O, 1/I)
    private static final String ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int LUNGHEZZA_CODICE = 12;
    private static final int MAX_TENTATIVI = 10;
    private static final long FINESTRA_MS = 10 * 60 * 1000L;

    private final SecureRandom random = new SecureRandom();
    private final Map<Long, long[]> tentativiFalliti = new ConcurrentHashMap<>();

    private final DispositivoRistoranteRepository dispositivoRepository;
    private final RistoranteRepository ristoranteRepository;
    private final RistoranteRuoloRepository ruoloRepository;
    private final JwtUtil jwtUtil;
    private final DispositivoAccessService accessService;
    private final SimpMessagingTemplate messagingTemplate;

    public DispositivoController(DispositivoRistoranteRepository dispositivoRepository,
                                 RistoranteRepository ristoranteRepository,
                                 RistoranteRuoloRepository ruoloRepository,
                                 JwtUtil jwtUtil,
                                 DispositivoAccessService accessService,
                                 SimpMessagingTemplate messagingTemplate) {
        this.dispositivoRepository = dispositivoRepository;
        this.ristoranteRepository = ristoranteRepository;
        this.ruoloRepository = ruoloRepository;
        this.jwtUtil = jwtUtil;
        this.accessService = accessService;
        this.messagingTemplate = messagingTemplate;
    }

    private void forzaLogout(Long dispositivoId) {
        accessService.invalida(dispositivoId);
        messagingTemplate.convertAndSend("/topic/dispositivo." + dispositivoId + ".logout", Map.of("type", "FORCE_LOGOUT"));
    }

    // GET /api/ristoranti/{id}/dispositivi  (superadmin o admin di quel ristorante)
    @GetMapping("/ristoranti/{ristoranteId}/dispositivi")
    public List<Map<String, Object>> elenco(@PathVariable Long ristoranteId) {
        richiediAdminDelRistoranteOSuperadmin(ristoranteId);
        return dispositivoRepository.findByRistoranteIdOrderByCreatedAtDesc(ristoranteId)
                .stream().map(this::toDto).toList();
    }

    // POST /api/ristoranti/{id}/dispositivi  (solo superadmin) - il codice e' restituito una sola volta
    @PostMapping("/ristoranti/{ristoranteId}/dispositivi")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> crea(@PathVariable Long ristoranteId, @RequestBody Map<String, String> body) {
        richiediSuperadmin();
        if (!ristoranteRepository.existsById(ristoranteId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Ristorante non trovato");
        }
        String nome = body.get("nome") == null ? "" : body.get("nome").trim();
        String ruolo = body.get("ruolo");
        if (nome.isEmpty() || nome.length() > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nome dispositivo non valido");
        }
        if (ruolo == null || !RUOLI.contains(ruolo)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ruolo non valido");
        }

        String codice = generaCodice();
        DispositivoRistorante d = new DispositivoRistorante();
        d.setRistoranteId(ristoranteId);
        d.setNome(nome);
        d.setRuolo(ruolo);
        d.setCodiceHash(hash(codice));
        d = dispositivoRepository.save(d);

        Map<String, Object> out = toDto(d);
        out.put("codice", formatta(codice));
        return out;
    }

    // DELETE /api/ristoranti/{id}/dispositivi/{dispositivoId}  (solo superadmin) - revoca il codice
    @DeleteMapping("/ristoranti/{ristoranteId}/dispositivi/{dispositivoId}")
    public Map<String, Object> revoca(@PathVariable Long ristoranteId, @PathVariable Long dispositivoId) {
        richiediSuperadmin();
        DispositivoRistorante d = dispositivoRepository.findByIdAndRistoranteId(dispositivoId, ristoranteId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Dispositivo non trovato"));
        if (d.getRevokedAt() == null) {
            d.setRevokedAt(OffsetDateTime.now());
            dispositivoRepository.save(d);
            forzaLogout(d.getId());
        }
        return toDto(d);
    }

    // PUT /api/ristoranti/{id}/dispositivi/{dispositivoId}/blocco  {"bloccato": true|false}      (superadmin o admin di quel ristorante)
    // Blocco/sblocco reversibile, distinto dalla revoca
    @PutMapping("/ristoranti/{ristoranteId}/dispositivi/{dispositivoId}/blocco")
    @Transactional
    public Map<String, Object> blocco(@PathVariable Long ristoranteId, @PathVariable Long dispositivoId,
                                      @RequestBody Map<String, Object> body) {
          String email = richiediAdminDelRistoranteOSuperadmin(ristoranteId);
        DispositivoRistorante d = dispositivoRepository.findByIdAndRistoranteId(dispositivoId, ristoranteId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Dispositivo non trovato"));
        if (!(body.get("bloccato") instanceof Boolean bloccato)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Campo 'bloccato' mancante");
        }
        if (bloccato) {
            d.setBloccatoAt(OffsetDateTime.now());
            d.setBloccatoDa(email);
        } else {
            d.setBloccatoAt(null);
            d.setBloccatoDa(null);
        }
        d = dispositivoRepository.save(d);
        accessService.invalida(d.getId());
        if (bloccato) forzaLogout(d.getId());
        return toDto(d);
    }

    // POST /api/ristoranti/{id}/dispositivi/{dispositivoId}/rigenera  (solo superadmin)
    // Il vecchio codice smette subito di funzionare; il nuovo e' restituito una sola volta
    @PostMapping("/ristoranti/{ristoranteId}/dispositivi/{dispositivoId}/rigenera")
    @Transactional
    public Map<String, Object> rigenera(@PathVariable Long ristoranteId, @PathVariable Long dispositivoId) {
        richiediSuperadmin();
        DispositivoRistorante d = dispositivoRepository.findByIdAndRistoranteId(dispositivoId, ristoranteId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Dispositivo non trovato"));
        if (d.getRevokedAt() != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Dispositivo revocato");
        }
        String codice = generaCodice();
        d.setCodiceHash(hash(codice));
        d = dispositivoRepository.save(d);

        Map<String, Object> out = toDto(d);
        out.put("codice", formatta(codice));
        return out;
    }

    // POST /api/auth/device-activate  - richiede il token del login standard del ristorante
    @PostMapping("/auth/device-activate")
    @Transactional
    public Map<String, Object> attiva(@RequestBody Map<String, String> body, HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Autenticazione richiesta");
        }
        String token = authHeader.substring(7);
        Long ristoranteId;
        String email;
        try {
            if (!jwtUtil.isTokenValid(token) || jwtUtil.extractClaims(token).get("profilo") != null) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token non valido");
            }
            ristoranteId = jwtUtil.extractRistoranteId(token);
            email = jwtUtil.extractUsername(token);
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token non valido");
        }
        if (ristoranteId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token non valido");
        }

        controllaTentativi(ristoranteId);
        String normalizzato = normalizza(body.get("codice"));
        DispositivoRistorante d = normalizzato.length() != LUNGHEZZA_CODICE ? null
                : dispositivoRepository.findByRistoranteIdAndCodiceHashAndRevokedAtIsNull(ristoranteId, hash(normalizzato))
                        .orElse(null);
        if (d == null) {
            registraFallimento(ristoranteId);
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Codice dispositivo non valido o revocato");
        }
        tentativiFalliti.remove(ristoranteId);
        if (d.getBloccatoAt() != null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Dispositivo bloccato");
        }

        d.setLastUsedAt(OffsetDateTime.now());
        dispositivoRepository.save(d);

        String nuovoToken = jwtUtil.generateDeviceToken(email, ristoranteId, d.getRuolo(), d.getId());
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("token", nuovoToken);
        out.put("profilo", d.getRuolo());
        out.put("dispositivo", toDto(d));
        return out;
    }

    private String richiediAdminDelRistoranteOSuperadmin(Long ristoranteId) {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof String email)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Utente non autenticato");
        }
        Ristorante r = ristoranteRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Utente non trovato"));
        if (r.getId().equals(ristoranteId)) {
            return email;
        }
        var ruoli = ruoloRepository.findRuoliByRistoranteId(r.getId());
        if (ruoli == null || !ruoli.contains("superadmin")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Permesso negato");
        }
        return email;
    }

    private String richiediSuperadmin() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof String email)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Utente non autenticato");
        }
        Ristorante r = ristoranteRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Utente non trovato"));
        var ruoli = ruoloRepository.findRuoliByRistoranteId(r.getId());
        if (ruoli == null || !ruoli.contains("superadmin")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Permesso negato: solo superadmin");
        }
        return email;
    }

    private void controllaTentativi(Long ristoranteId) {
        long[] stato = tentativiFalliti.get(ristoranteId);
        if (stato != null && System.currentTimeMillis() - stato[1] < FINESTRA_MS && stato[0] >= MAX_TENTATIVI) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Troppi tentativi, riprova tra qualche minuto");
        }
    }

    private void registraFallimento(Long ristoranteId) {
        long ora = System.currentTimeMillis();
        tentativiFalliti.merge(ristoranteId, new long[]{1, ora}, (vecchio, nuovo) ->
                ora - vecchio[1] >= FINESTRA_MS ? nuovo : new long[]{vecchio[0] + 1, vecchio[1]});
    }

    private String generaCodice() {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < LUNGHEZZA_CODICE; i++) {
            sb.append(ALFABETO.charAt(random.nextInt(ALFABETO.length())));
        }
        return sb.toString();
    }

    private static String formatta(String codice) {
        return codice.substring(0, 4) + "-" + codice.substring(4, 8) + "-" + codice.substring(8);
    }

    private static String normalizza(String codice) {
        return codice == null ? "" : codice.toUpperCase().replaceAll("[^A-Z0-9]", "");
    }

    private static String hash(String codiceNormalizzato) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(codiceNormalizzato.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    private Map<String, Object> toDto(DispositivoRistorante d) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", d.getId());
        m.put("ristoranteId", d.getRistoranteId());
        m.put("nome", d.getNome());
        m.put("ruolo", d.getRuolo());
        m.put("createdAt", d.getCreatedAt());
        m.put("lastUsedAt", d.getLastUsedAt());
        m.put("revokedAt", d.getRevokedAt());
        m.put("bloccatoAt", d.getBloccatoAt());
        return m;
    }
}
