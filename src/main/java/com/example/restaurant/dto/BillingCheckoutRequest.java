package com.example.restaurant.dto;

import jakarta.validation.constraints.NotBlank;

public class BillingCheckoutRequest {

    @NotBlank
    private String piano;

    public String getPiano() {
        return piano;
    }

    public void setPiano(String piano) {
        this.piano = piano;
    }
}
