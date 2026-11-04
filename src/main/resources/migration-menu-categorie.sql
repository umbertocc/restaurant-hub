-- Migrazione distruttiva limitata ai dati di test di menu e ordini.
-- Eseguire una sola volta prima di avviare la nuova versione dell'applicazione.
BEGIN;

DELETE FROM restaurant.abbinamenti;
DELETE FROM restaurant.ordine_items;
DELETE FROM restaurant.ordini;
DELETE FROM restaurant.menu_items;

CREATE TABLE IF NOT EXISTS restaurant.menu_categorie (
    id              BIGSERIAL PRIMARY KEY,
    ristorante_id   BIGINT NOT NULL REFERENCES restaurant.ristoranti(id) ON DELETE CASCADE,
    nome            VARCHAR(100) NOT NULL,
    descrizione     VARCHAR(1000),
    destinazione    VARCHAR(20) NOT NULL CHECK (destinazione IN ('CUCINA', 'BAR', 'PIZZERIA')),
    CONSTRAINT uk_menu_categorie_ristorante_nome UNIQUE (ristorante_id, nome)
);

ALTER TABLE restaurant.menu_items ADD COLUMN IF NOT EXISTS categoria_id BIGINT
    REFERENCES restaurant.menu_categorie(id);
ALTER TABLE restaurant.menu_items ALTER COLUMN categoria_id SET NOT NULL;
ALTER TABLE restaurant.menu_items DROP COLUMN IF EXISTS categoria;
ALTER TABLE restaurant.ordine_items ADD COLUMN IF NOT EXISTS categoria VARCHAR(100);
ALTER TABLE restaurant.ordine_items ADD COLUMN IF NOT EXISTS destinazione VARCHAR(20);
ALTER TABLE restaurant.ordine_items ALTER COLUMN categoria TYPE VARCHAR(100);

COMMIT;
