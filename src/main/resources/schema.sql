-- =============================================
-- Restaurant Hub — Schema iniziale PostgreSQL
-- =============================================

CREATE TABLE IF NOT EXISTS restaurant.ristoranti (
    id          BIGSERIAL PRIMARY KEY,
    nome        VARCHAR(255) NOT NULL,
    email       VARCHAR(255) NOT NULL UNIQUE,
    telefono    VARCHAR(50),
    indirizzo   VARCHAR(255),
    citta       VARCHAR(100),
    logo_url    VARCHAR(500),
    password_hash VARCHAR(255),
    piano       VARCHAR(20) NOT NULL DEFAULT 'FREE',
    attivo      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS restaurant.tavoli (
    id              BIGSERIAL PRIMARY KEY,
    ristorante_id   BIGINT NOT NULL REFERENCES restaurant.ristoranti(id) ON DELETE CASCADE,
    numero          INT NOT NULL,
    capacita        INT NOT NULL,
    disponibile     BOOLEAN NOT NULL DEFAULT TRUE,
    posizione       VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS restaurant.prenotazioni (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ristorante_id       BIGINT NOT NULL REFERENCES restaurant.ristoranti(id),
    tavolo_id           BIGINT REFERENCES restaurant.tavoli(id),
    cliente_nome        VARCHAR(255) NOT NULL,
    cliente_email       VARCHAR(255),
    cliente_telefono    VARCHAR(50),
    data_ora            TIMESTAMPTZ NOT NULL,
    coperti             INT NOT NULL,
    note                TEXT,
    stato               VARCHAR(20) NOT NULL DEFAULT 'IN_ATTESA',
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS restaurant.menu_items (
    id              BIGSERIAL PRIMARY KEY,
    ristorante_id   BIGINT NOT NULL REFERENCES restaurant.ristoranti(id) ON DELETE CASCADE,
    nome            VARCHAR(255) NOT NULL,
    descrizione     TEXT,
    categoria       VARCHAR(50) NOT NULL,
    prezzo          NUMERIC(10, 2) NOT NULL,
    disponibile     BOOLEAN NOT NULL DEFAULT TRUE,
    immagine_url    VARCHAR(500),
    allergeni       TEXT
);

CREATE TABLE IF NOT EXISTS restaurant.ordini (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ristorante_id   BIGINT NOT NULL REFERENCES restaurant.ristoranti(id),
    tavolo_id       BIGINT NOT NULL REFERENCES restaurant.tavoli(id),
    prenotazione_id UUID REFERENCES restaurant.prenotazioni(id),
    stato           VARCHAR(20) NOT NULL DEFAULT 'APERTO',
    totale          NUMERIC(10, 2) NOT NULL DEFAULT 0,
    note            TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    chiuso_at       TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS restaurant.ordine_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ordine_id       UUID NOT NULL REFERENCES restaurant.ordini(id) ON DELETE CASCADE,
    menu_item_id    BIGINT NOT NULL REFERENCES restaurant.menu_items(id),
    quantita        INT NOT NULL,
    prezzo_unitario NUMERIC(10, 2) NOT NULL,
    note            TEXT
);

CREATE TABLE IF NOT EXISTS restaurant.abbinamenti (
    id                  BIGSERIAL PRIMARY KEY,
    piatto_id           BIGINT NOT NULL REFERENCES restaurant.menu_items(id),
    abbinamento_item_id BIGINT NOT NULL REFERENCES restaurant.menu_items(id),
    score               INT NOT NULL DEFAULT 80 CHECK (score BETWEEN 1 AND 100),
    tipo                VARCHAR(20),
    descrizione         TEXT
);

-- Indici utili
CREATE INDEX IF NOT EXISTS idx_prenotazioni_ristorante ON restaurant.prenotazioni(ristorante_id);
CREATE INDEX IF NOT EXISTS idx_prenotazioni_data ON restaurant.prenotazioni(data_ora);
CREATE INDEX IF NOT EXISTS idx_ordini_tavolo ON restaurant.ordini(tavolo_id, stato);
CREATE INDEX IF NOT EXISTS idx_abbinamenti_piatto ON restaurant.abbinamenti(piatto_id);
