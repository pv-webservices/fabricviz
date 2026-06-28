-- Fix internal MinIO Docker hostnames stored in the database.
-- Run with psql using: psql $DATABASE_URL -v public_url="$MINIO_PUBLIC_URL" -f fix_internal_minio_urls.sql
-- The :public_url variable must be set to the publicly accessible MinIO base URL
-- (e.g. http://localhost:9000 in dev, or your production CDN URL).

-- Fix predefined_rooms
UPDATE predefined_rooms
SET image_url = REPLACE(image_url, 'http://minio:9000', :'public_url')
WHERE image_url LIKE '%minio:9000%';

UPDATE predefined_rooms
SET thumbnail_url = REPLACE(thumbnail_url, 'http://minio:9000', :'public_url')
WHERE thumbnail_url IS NOT NULL AND thumbnail_url LIKE '%minio:9000%';

-- Fix fabrics (swatch_url and texture_url — fabrics has no image_url column)
UPDATE fabrics
SET swatch_url = REPLACE(swatch_url, 'http://minio:9000', :'public_url')
WHERE swatch_url IS NOT NULL AND swatch_url LIKE '%minio:9000%';

UPDATE fabrics
SET texture_url = REPLACE(texture_url, 'http://minio:9000', :'public_url')
WHERE texture_url IS NOT NULL AND texture_url LIKE '%minio:9000%';

-- Verification queries (should return 0 rows each after fix)
SELECT id, image_url FROM predefined_rooms WHERE image_url LIKE '%minio:9000%';
SELECT id, swatch_url FROM fabrics WHERE swatch_url LIKE '%minio:9000%';
SELECT id, texture_url FROM fabrics WHERE texture_url LIKE '%minio:9000%';
