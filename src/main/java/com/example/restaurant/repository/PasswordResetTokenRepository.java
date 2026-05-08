package com.example.restaurant.repository;

import com.example.restaurant.model.PasswordResetToken;
import com.example.restaurant.model.Ristorante;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    Optional<PasswordResetToken> findByToken(String token);
    void deleteByRistorante(Ristorante ristorante);
}
