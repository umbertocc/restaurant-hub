package com.example.restaurant.service;

import com.example.restaurant.model.Ristorante;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class NotificaService {

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
        msg.setFrom(mittente);
        msg.setTo("info@torrepalivacanze.it");
        msg.setSubject("Nuovo ristorante registrato: " + ristorante.getNome());
        msg.setText(
            "Un nuovo ristorante si è registrato su Restaurant Hub.\n\n" +
            "Nome:      " + ristorante.getNome() + "\n" +
            "Email:     " + ristorante.getEmail() + "\n" +
            "Telefono:  " + (ristorante.getTelefono() != null ? ristorante.getTelefono() : "-") + "\n" +
            "Città:     " + (ristorante.getCitta() != null ? ristorante.getCitta() : "-") + "\n" +
            "Indirizzo: " + (ristorante.getIndirizzo() != null ? ristorante.getIndirizzo() : "-") + "\n"
        );
        try {
            mailSender.send(msg);
            System.out.println("[EMAIL] Notifica nuova registrazione inviata con successo a info@torrepalivacanze.it");
        } catch (Exception e) {
            System.err.println("[EMAIL] Errore invio notifica nuova registrazione: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
