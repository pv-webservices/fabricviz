import { Pool } from 'pg';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';

// ── Storage mode detection ──────────────────────────────────────────────
const STORAGE_MODE = (process.env.STORAGE_MODE || 'local').toLowerCase();

// ── S3 / R2 client (lazy-initialised only when needed) ──────────────────
let s3Client: import('@aws-sdk/client-s3').S3Client | null = null;

function getS3Client(): import('@aws-sdk/client-s3').S3Client {
  if (!s3Client) {
    // Dynamic import is avoided so that type-checking works; the package
    // must be installed when STORAGE_MODE is r2 or s3.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { S3Client } = require('@aws-sdk/client-s3') as typeof import('@aws-sdk/client-s3');

    s3Client = new S3Client({
      endpoint: process.env.STORAGE_ENDPOINT,
      region: process.env.STORAGE_REGION || 'auto',
      credentials: {
        accessKeyId: process.env.STORAGE_ACCESS_KEY || '',
        secretAccessKey: process.env.STORAGE_SECRET_KEY || '',
      },
      forcePathStyle: true, // Required for R2 & many S3-compatible stores
    });
  }
  return s3Client;
}

const STORAGE_BUCKET = process.env.STORAGE_BUCKET || 'fabricviz';
const LOCAL_UPLOAD_DIR = process.env.LOCAL_UPLOAD_DIR || './uploads';

console.log(`[Storage] Mode: ${STORAGE_MODE}`);

// ── Helpers ──────────────────────────────────────────────────────────────

function generateFilename(originalFilename: string): string {
  const hash = crypto.randomBytes(8).toString('hex');
  const ext = path.extname(originalFilename) || '.jpg';
  return `${Date.now()}-${hash}${ext}`;
}

// ── uploadFile ───────────────────────────────────────────────────────────

export async function uploadFile(
  fileBuffer: Buffer,
  originalFilename: string,
  mimeType: string
): Promise<string> {
  const newFilename = generateFilename(originalFilename);

  if (STORAGE_MODE === 'r2' || STORAGE_MODE === 's3') {
    return uploadToS3(fileBuffer, newFilename, mimeType);
  }

  // Default: local filesystem
  return uploadToLocal(fileBuffer, newFilename);
}

async function uploadToS3(
  fileBuffer: Buffer,
  filename: string,
  mimeType: string
): Promise<string> {
  const { PutObjectCommand } = require('@aws-sdk/client-s3') as typeof import('@aws-sdk/client-s3');
  const client = getS3Client();

  await client.send(
    new PutObjectCommand({
      Bucket: STORAGE_BUCKET,
      Key: filename,
      Body: fileBuffer,
      ContentType: mimeType,
    })
  );

  const endpoint = (process.env.STORAGE_ENDPOINT || '').replace(/\/+$/, '');
  return `${endpoint}/${STORAGE_BUCKET}/${filename}`;
}

async function uploadToLocal(fileBuffer: Buffer, filename: string): Promise<string> {
  // Ensure the upload directory exists
  await fs.promises.mkdir(LOCAL_UPLOAD_DIR, { recursive: true });

  const filePath = path.join(LOCAL_UPLOAD_DIR, filename);
  await fs.promises.writeFile(filePath, fileBuffer);

  const baseUrl = process.env.API_URL || 'http://localhost:4000';
  return `${baseUrl}/uploads/${filename}`;
}

// ── deleteFile ───────────────────────────────────────────────────────────

export async function deleteFile(url: string): Promise<void> {
  if (STORAGE_MODE === 'r2' || STORAGE_MODE === 's3') {
    return deleteFromS3(url);
  }

  // Default: local filesystem
  return deleteFromLocal(url);
}

async function deleteFromS3(url: string): Promise<void> {
  const { DeleteObjectCommand } = require('@aws-sdk/client-s3') as typeof import('@aws-sdk/client-s3');
  const client = getS3Client();

  // Extract the object key from the URL (last path segment after the bucket name)
  const urlObj = new URL(url);
  const parts = urlObj.pathname.split('/').filter(Boolean);
  // pathname is typically /<bucket>/<key> — we want the key (everything after bucket)
  const key = parts.length > 1 ? parts.slice(1).join('/') : parts.join('/');

  await client.send(
    new DeleteObjectCommand({
      Bucket: STORAGE_BUCKET,
      Key: key,
    })
  );

  console.log(`[Storage] Deleted from S3/R2: ${key}`);
}

async function deleteFromLocal(url: string): Promise<void> {
  // url is expected to be like /uploads/filename.jpg
  const filename = path.basename(url);
  const filePath = path.join(LOCAL_UPLOAD_DIR, filename);

  try {
    await fs.promises.unlink(filePath);
    console.log(`[Storage] Deleted local file: ${filePath}`);
  } catch (err: unknown) {
    // File may already be gone — log but don't throw
    console.warn(`[Storage] Could not delete local file ${filePath}:`, err);
  }
}

// ── Storage snapshots (unchanged) ────────────────────────────────────────

export async function recordStorageSnapshot(
  db: Pool,
  bytesAdded: number,
  filesAdded: number
): Promise<void> {
  const today = new Date().toISOString().split('T')[0];

  // Upsert the snapshot for today
  await db.query(
    `INSERT INTO storage_snapshots (snapshot_date, total_bytes, total_files)
     VALUES ($1, $2, $3)
     ON CONFLICT (snapshot_date) 
     DO UPDATE SET 
       total_bytes = storage_snapshots.total_bytes + EXCLUDED.total_bytes,
       total_files = storage_snapshots.total_files + EXCLUDED.total_files`,
    [today, bytesAdded, filesAdded]
  );
}

export async function getStorageSnapshots(db: Pool) {
  const result = await db.query(`SELECT * FROM storage_snapshots ORDER BY snapshot_date DESC LIMIT 30`);
  return result.rows;
}
