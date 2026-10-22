package com.example.restaurant.config;

import com.example.restaurant.model.Ristorante;
import com.example.restaurant.model.RistoranteRuolo;
import com.example.restaurant.repository.RistoranteRepository;
import com.example.restaurant.repository.RistoranteRuoloRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Crea al primo avvio l'account amministratore per le installazioni locali.
 * Attivo solo se BOOTSTRAP_ADMIN_EMAIL è valorizzata e il database non contiene ristoranti.
 * L'account è già attivo, senza prova a tempo, con ruolo superadmin.
 */
@Component
@ConditionalOnProperty(name = "app.bootstrap.admin-email")
public class LocalBootstrap implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(LocalBootstrap.class);

    private final RistoranteRepository ristoranteRepository;
    private final RistoranteRuoloRepository ruoloRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.bootstrap.admin-email}")
    private String email;

    @Value("${app.bootstrap.admin-password:}")
    private String password;

    @Value("${app.bootstrap.restaurant-name:Il mio ristorante}")
    private String nome;

    public LocalBootstrap(RistoranteRepository ristoranteRepository,
                          RistoranteRuoloRepository ruoloRepository,
                          PasswordEncoder passwordEncoder) {
        this.ristoranteRepository = ristoranteRepository;
        this.ruoloRepository = ruoloRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (email == null || email.isBlank() || ristoranteRepository.count() > 0) {
            return;
        }
        if (password == null || password.length() < 8) {
            log.warn("BOOTSTRAP_ADMIN_PASSWORD mancante o più corta di 8 caratteri: account iniziale non creato");
            return;
        }

        Ristorante r = new Ristorante();
        r.setNome(nome);
        r.setEmail(email.trim());
        r.setPasswordHash(passwordEncoder.encode(password));
        r.setPiano(Ristorante.Piano.PRO);
        r.setAttivo(true);
        r.setSubscriptionStatus(Ristorante.SubscriptionStatus.ACTIVE_PAID);
        Ristorante salvato = ristoranteRepository.save(r);

        RistoranteRuolo ruolo = new RistoranteRuolo();
        ruolo.setRistoranteId(salvato.getId());
        ruolo.setRuolo("superadmin");
        ruoloRepository.save(ruolo);

        log.info("Account iniziale creato: {}", salvato.getEmail());
    }
}
