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

COMMIT;