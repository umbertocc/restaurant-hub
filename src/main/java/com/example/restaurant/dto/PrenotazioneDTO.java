package com.example.restaurant.dto;

import jakarta.validation.constraints.*;
import java.time.OffsetDateTime;

public class PrenotazioneDTO {

    @NotNull
    private Long ristoranteId;

    private Long tavoloId;

    @NotBlank
    private String clienteNome;

    @Email
    private String clienteEmail;

    private String clienteTelefono;

    @NotNull
    private OffsetDateTime dataOra;

    @NotNull
    @Min(1)
    private Integer coperti;

    private String note;

    // Getters & Setters
    public Long getRistoranteId() { return ristoranteId; }
    public void setRistoranteId(Long ristoranteId) { this.ristoranteId = ristoranteId; }

    public Long getTavoloId() { return tavoloId; }
    public void setTavoloId(Long tavoloId) { this.tavoloId = tavoloId; }

    public String getClienteNome() { return clienteNome; }
    public void setClienteNome(String clienteNome) { this.clienteNome = clienteNome; }

    public String getClienteEmail() { return clienteEmail; }
    public void setClienteEmail(String clienteEmail) { this.clienteEmail = clienteEmail; }

    public String getClienteTelefono() { return clienteTelefono; }
    public void setClienteTelefono(String clienteTelefono) { this.clienteTelefono = clienteTelefono; }

    public OffsetDateTime getDataOra() { return dataOra; }
    public void setDataOra(OffsetDateTime dataOra) { this.dataOra = dataOra; }

    public Integer getCoperti() { return coperti; }
    public void setCoperti(Integer coperti) { this.coperti = coperti; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
}
