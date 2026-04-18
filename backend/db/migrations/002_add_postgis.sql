BEGIN;

-- 1. Enable PostGIS (safe if already exists)
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Add new geography column (do not remove old yet)
ALTER TABLE locations
ADD COLUMN IF NOT EXISTS geo_location GEOGRAPHY(POINT, 4326);

-- 3. Migrate existing lat/lng into geo_location
UPDATE locations
SET geo_location = ST_SetSRID(ST_MakePoint(lng, lat), 4326)
WHERE lat IS NOT NULL AND lng IS NOT NULL AND geo_location IS NULL;

-- 4. Create spatial index for performance
CREATE INDEX IF NOT EXISTS idx_locations_geo
ON locations
USING GIST (geo_location);


-- Category (house, car, land)
ALTER TABLE listings
ADD COLUMN IF NOT EXISTS category VARCHAR(50);

-- Listing type (rent, sale)
ALTER TABLE listings
ADD COLUMN IF NOT EXISTS listing_type VARCHAR(50);

-- Optional: enforce values
ALTER TABLE listings
ADD CONSTRAINT check_category
CHECK (category IN ('house', 'car', 'land'));

ALTER TABLE listings
ADD CONSTRAINT check_listing_type
CHECK (listing_type IN ('rent', 'sale'));

COMMIT;