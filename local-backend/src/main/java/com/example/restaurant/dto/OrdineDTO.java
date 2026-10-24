package com.example.restaurant.dto;

import jakarta.validation.constraints.*;
import java.util.List;
import java.util.UUID;

public class OrdineDTO {

    @NotNull
    private Long ristoranteId;

    @NotNull
    private Long tavoloId;

    private UUID prenotazioneId;

    @NotEmpty
    private List<OrdineItemDTO> items;

    private String note;

    public static class OrdineItemDTO {
        @NotNull
        private Long menuItemId;

        @NotNull
        @Min(1)
        private Integer quantita;

        private String note;

        public Long getMenuItemId() { return menuItemId; }
        public void setMenuItemId(Long menuItemId) { this.menuItemId = menuItemId; }

        public Integer getQuantita() { return quantita; }
        public void setQuantita(Integer quantita) { this.quantita = quantita; }

        public String getNote() { return note; }
        public void setNote(String note) { this.note = note; }
    }

    // Getters & Setters
    public Long getRistoranteId() { return ristoranteId; }
    public void setRistoranteId(Long ristoranteId) { this.ristoranteId = ristoranteId; }

    public Long getTavoloId() { return tavoloId; }
    public void setTavoloId(Long tavoloId) { this.tavoloId = tavoloId; }

    public UUID getPrenotazioneId() { return prenotazioneId; }
    public void setPrenotazioneId(UUID prenotazioneId) { this.prenotazioneId = prenotazioneId; }

    public List<OrdineItemDTO> getItems() { return items; }
    public void setItems(List<OrdineItemDTO> items) { this.items = items; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
}
