
package com.example.restaurant.service;

import com.example.restaurant.model.Ristorante;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class NotificaService {

    private static final Logger logger = LoggerFactory.getLogger(NotificaService.class);

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String mittente;

    public NotificaService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Async
    public void notificaResetPassword(Ristorante ristorante, String token) {
        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setFrom(mittente);
        msg.setTo(ristorante.getEmail());
        msg.setSubject("Reset password Restaurant Hub");
        String resetUrl = "https://restaurant-hub/reset-password?token=" + token;
        msg.setText(
            "Hai richiesto il reset della password.\n" +
            "Clicca sul link seguente per impostare una nuova password (valido 30 minuti):\n" +
            resetUrl + "\n\n" +
            "Se non hai richiesto tu questa operazione, ignora questa email."
        );
        mailSender.send(msg);
    }

    @Async
    public void notificaNuovaRegistrazione(Ristorante ristorante) {
        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setFrom("info@torrepalivacanze.it");
        msg.setTo("info@torrepalivacanze.it");
        msg.setSubject("Nuovo ristorante registrato: " + ristorante.getNome());
        msg.setText(
            "Un nuovo ristorante si è registrato su Restaurant Hub.\n\n" +
            "Nome:      " + ristorante.getNome() + "\n" +
            "Email:     " + ristorante.getEmail() + "\n" +
            "Telefono:  " + (ristorante.getTelefono() != null ? ristorante.getTelefono() : "-") + "\n" +
            "Città:     " + (ristorante.getCitta() != null ? ristorante.getCitta() : "-") + "\n" +
            "Indirizzo: " + (ristorante.getIndirizzo() != null ? ristorante.getIndirizzo() : "-") + "\n\n" +
            "Lo stato del ristorante è: IN ATTESA DI APPROVAZIONE da parte di un superadmin.\n" +
            "L'account non potrà accedere finché non verrà approvato."
        );
        try {
            mailSender.send(msg);
            logger.info("[EMAIL] Notifica nuova registrazione inviata con successo a info@torrepalivacanze.it");
        } catch (Exception e) {
            logger.error("[EMAIL] Errore invio notifica nuova registrazione: {}", e.getMessage(), e);
        }
    }

    @Async
    public void notificaReminderTrial(Ristorante ristorante, int giorniMancanti) {
        if (giorniMancanti <= 0) {
            return;
        }
        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setFrom(mittente);
        msg.setTo(ristorante.getEmail());
        msg.setSubject("Il tuo trial Restaurant Hub scade tra " + giorniMancanti + " giorno/i");
        msg.setText(
            "Ciao " + ristorante.getNome() + ",\n\n" +
            "il periodo di prova scadrà tra " + giorniMancanti + " giorno/i.\n" +
            "Per evitare interruzioni, attiva l'abbonamento dalla sezione Abbonamento del pannello.\n\n" +
            "Team Restaurant Hub"
        );
        try {
            mailSender.send(msg);
        } catch (Exception e) {
            logger.warn("[EMAIL] Reminder trial non inviato a {}: {}", ristorante.getEmail(), e.getMessage());
        }
    }

    @Async
    public void notificaTrialScaduto(Ristorante ristorante, int graceDays) {
        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setFrom(mittente);
        msg.setTo(ristorante.getEmail());
        msg.setSubject("Trial scaduto - attiva il tuo abbonamento");
        String graceText = graceDays > 0
            ? "Hai ancora " + graceDays + " giorni di grace period prima del blocco completo delle funzioni premium."
            : "Le funzioni di modifica dati sono ora in sola lettura finché non attivi un piano.";
        msg.setText(
            "Ciao " + ristorante.getNome() + ",\n\n" +
            "il trial di 30 giorni è terminato. " + graceText + "\n" +
            "Vai nella sezione Abbonamento per attivare il piano PRO o ENTERPRISE.\n\n" +
            "Team Restaurant Hub"
        );
        try {
            mailSender.send(msg);
        } catch (Exception e) {
            logger.warn("[EMAIL] Notifica trial scaduto non inviata a {}: {}", ristorante.getEmail(), e.getMessage());
        }
    }
}
