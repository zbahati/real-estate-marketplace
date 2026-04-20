BEGIN;

-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- Add geo column
ALTER TABLE locations
ADD COLUMN IF NOT EXISTS geo_location GEOGRAPHY(POINT, 4326);

-- Migrate lat/lng → geo
UPDATE locations
SET geo_location = ST_SetSRID(ST_MakePoint(lng, lat), 4326)
WHERE lat IS NOT NULL 
  AND lng IS NOT NULL 
  AND geo_location IS NULL;

-- Spatial index
CREATE INDEX IF NOT EXISTS idx_locations_geo
ON locations
USING GIST (geo_location);

-- Category + Listing Type
ALTER TABLE listings
ADD COLUMN IF NOT EXISTS category VARCHAR(50);

ALTER TABLE listings
ADD COLUMN IF NOT EXISTS listing_type VARCHAR(50);

-- ✅ SAFE CONSTRAINT: category
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_category'
  ) THEN
    ALTER TABLE listings
    ADD CONSTRAINT check_category
    CHECK (category IN ('house', 'car', 'land'));
  END IF;
END$$;

-- ✅ SAFE CONSTRAINT: listing_type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_listing_type'
  ) THEN
    ALTER TABLE listings
    ADD CONSTRAINT check_listing_type
    CHECK (listing_type IN ('rent', 'sale'));
  END IF;
END$$;

COMMIT;