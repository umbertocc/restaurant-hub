package com.example.restaurant.service;

import com.example.restaurant.model.Ristorante;
import com.example.restaurant.repository.RistoranteRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class TrialLifecycleService {

    private static final List<Integer> REMINDER_DAYS = List.of(7, 3, 1);

    private final RistoranteRepository ristoranteRepository;
    private final NotificaService notificaService;

    @Value("${app.billing.trial-grace-days:5}")
    private int trialGraceDays;

    public TrialLifecycleService(RistoranteRepository ristoranteRepository,
                                 NotificaService notificaService) {
        this.ristoranteRepository = ristoranteRepository;
        this.notificaService = notificaService;
    }

    @Scheduled(cron = "0 15 6 * * *")
    public void runDailyLifecycle() {
        OffsetDateTime now = OffsetDateTime.now();

        List<Ristorante> trialRestaurants = ristoranteRepository
                .findByTrialEndAtIsNotNullAndSubscriptionStatusIn(
                        List.of(Ristorante.SubscriptionStatus.TRIAL_ACTIVE, Ristorante.SubscriptionStatus.TRIAL_GRACE)
                );

        for (Ristorante ristorante : trialRestaurants) {
            if (ristorante.getSubscriptionStatus() == Ristorante.SubscriptionStatus.ACTIVE_PAID) {
                continue;
            }

            long daysLeft = ChronoUnit.DAYS.between(now.toLocalDate(), ristorante.getTrialEndAt().toLocalDate());
            if (ristorante.getSubscriptionStatus() == Ristorante.SubscriptionStatus.TRIAL_ACTIVE
                    && REMINDER_DAYS.contains((int) daysLeft)
                    && (ristorante.getTrialLastNotifiedDay() == null || ristorante.getTrialLastNotifiedDay() != (int) daysLeft)) {
                notificaService.notificaReminderTrial(ristorante, (int) daysLeft);
                ristorante.setTrialLastNotifiedDay((int) daysLeft);
            }

            if (ristorante.getSubscriptionStatus() == Ristorante.SubscriptionStatus.TRIAL_ACTIVE
                    && now.isAfter(ristorante.getTrialEndAt())) {
                if (trialGraceDays > 0) {
                    ristorante.setSubscriptionStatus(Ristorante.SubscriptionStatus.TRIAL_GRACE);
                    ristorante.setTrialGraceEndAt(now.plusDays(trialGraceDays));
                } else {
                    ristorante.setSubscriptionStatus(Ristorante.SubscriptionStatus.EXPIRED_TRIAL);
                }
                notificaService.notificaTrialScaduto(ristorante, trialGraceDays);
            }
        }

        List<Ristorante> expiredGrace = ristoranteRepository
                .findBySubscriptionStatusAndTrialGraceEndAtBefore(Ristorante.SubscriptionStatus.TRIAL_GRACE, now);

        for (Ristorante ristorante : expiredGrace) {
            ristorante.setSubscriptionStatus(Ristorante.SubscriptionStatus.EXPIRED_TRIAL);
        }

        for (Ristorante ristorante : trialRestaurants) {
            ristoranteRepository.save(ristorante);
        }
        if (!expiredGrace.isEmpty()) {
            for (Ristorante ristorante : expiredGrace) {
                ristoranteRepository.save(ristorante);
            }
        }
    }
}
