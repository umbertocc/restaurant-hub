package com.example.restaurant.repository;

import com.example.restaurant.model.Ristorante;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

public interface RistoranteRepository extends JpaRepository<Ristorante, Long> {
    Optional<Ristorante> findByEmail(String email);
    Optional<Ristorante> findByStripeSubscriptionId(String stripeSubscriptionId);
    Optional<Ristorante> findByStripeCustomerId(String stripeCustomerId);
    boolean existsByEmail(String email);
    List<Ristorante> findByTrialEndAtIsNotNullAndSubscriptionStatusIn(List<Ristorante.SubscriptionStatus> statuses);
    List<Ristorante> findBySubscriptionStatusAndTrialGraceEndAtBefore(Ristorante.SubscriptionStatus status, OffsetDateTime now);
}
