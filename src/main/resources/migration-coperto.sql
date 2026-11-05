-- Aggiunge la gestione del coperto mantenendo invariati gli ordini esistenti.
ALTER TABLE restaurant.ristoranti
    ADD COLUMN IF NOT EXISTS prezzo_coperto NUMERIC(10, 2) NOT NULL DEFAULT 0
    CHECK (prezzo_coperto >= 0);

ALTER TABLE restaurant.ordini
    ADD COLUMN IF NOT EXISTS coperti INT NOT NULL DEFAULT 1
    CHECK (coperti >= 1);

ALTER TABLE restaurant.ordini
    ADD COLUMN IF NOT EXISTS prezzo_coperto NUMERIC(10, 2) NOT NULL DEFAULT 0
    CHECK (prezzo_coperto >= 0);
