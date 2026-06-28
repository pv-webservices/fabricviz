import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../../../.env') });

import { Pool } from 'pg';

const publicUrl = process.env['MINIO_PUBLIC_URL'] || process.env['STORAGE_ENDPOINT'] || 'http://localhost:9000';

const db = new Pool({
  connectionString: process.env['DATABASE_URL'] || 'postgresql://fabricviz:password@localhost:5432/fabricviz',
});

async function main(): Promise<void> {
  console.log(`[fix-minio-urls] Starting — replacing 'http://minio:9000' with '${publicUrl}'`);

  try {
    // ── predefined_rooms.image_url ──────────────────────────────────────────
    const r1 = await db.query(
      `UPDATE predefined_rooms
       SET image_url = REPLACE(image_url, 'http://minio:9000', $1)
       WHERE image_url LIKE '%minio:9000%'`,
      [publicUrl],
    );
    console.log(`[fix-minio-urls] predefined_rooms.image_url: ${r1.rowCount} rows updated`);

    // ── predefined_rooms.thumbnail_url ─────────────────────────────────────
    const r2 = await db.query(
      `UPDATE predefined_rooms
       SET thumbnail_url = REPLACE(thumbnail_url, 'http://minio:9000', $1)
       WHERE thumbnail_url IS NOT NULL AND thumbnail_url LIKE '%minio:9000%'`,
      [publicUrl],
    );
    console.log(`[fix-minio-urls] predefined_rooms.thumbnail_url: ${r2.rowCount} rows updated`);

    // ── fabrics.swatch_url ──────────────────────────────────────────────────
    const r3 = await db.query(
      `UPDATE fabrics
       SET swatch_url = REPLACE(swatch_url, 'http://minio:9000', $1)
       WHERE swatch_url IS NOT NULL AND swatch_url LIKE '%minio:9000%'`,
      [publicUrl],
    );
    console.log(`[fix-minio-urls] fabrics.swatch_url: ${r3.rowCount} rows updated`);

    // ── fabrics.texture_url ─────────────────────────────────────────────────
    const r4 = await db.query(
      `UPDATE fabrics
       SET texture_url = REPLACE(texture_url, 'http://minio:9000', $1)
       WHERE texture_url IS NOT NULL AND texture_url LIKE '%minio:9000%'`,
      [publicUrl],
    );
    console.log(`[fix-minio-urls] fabrics.texture_url: ${r4.rowCount} rows updated`);

    // ── Verification: predefined_rooms ─────────────────────────────────────
    const v1 = await db.query<{ id: string; image_url: string }>(
      `SELECT id, image_url FROM predefined_rooms WHERE image_url LIKE '%minio:9000%'`,
    );
    if (v1.rowCount === 0) {
      console.log('[fix-minio-urls] ✅ No internal URLs remaining in predefined_rooms');
    } else {
      console.error('[fix-minio-urls] ❌ Still found internal URLs in predefined_rooms:', v1.rows);
    }

    // ── Verification: fabrics.swatch_url ───────────────────────────────────
    const v2 = await db.query<{ id: string; swatch_url: string }>(
      `SELECT id, swatch_url FROM fabrics WHERE swatch_url LIKE '%minio:9000%'`,
    );
    if (v2.rowCount === 0) {
      console.log('[fix-minio-urls] ✅ No internal URLs remaining in fabrics.swatch_url');
    } else {
      console.error('[fix-minio-urls] ❌ Still found internal URLs in fabrics.swatch_url:', v2.rows);
    }

    // ── Verification: fabrics.texture_url ──────────────────────────────────
    const v3 = await db.query<{ id: string; texture_url: string }>(
      `SELECT id, texture_url FROM fabrics WHERE texture_url LIKE '%minio:9000%'`,
    );
    if (v3.rowCount === 0) {
      console.log('[fix-minio-urls] ✅ No internal URLs remaining in fabrics.texture_url');
    } else {
      console.error('[fix-minio-urls] ❌ Still found internal URLs in fabrics.texture_url:', v3.rows);
    }

    console.log('[fix-minio-urls] Done.');
  } catch (err) {
    console.error('[fix-minio-urls] Fatal error:', err);
    process.exit(1);
  } finally {
    await db.end();
  }
}

main();
