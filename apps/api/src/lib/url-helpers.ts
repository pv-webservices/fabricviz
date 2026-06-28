const MINIO_INTERNAL_HOST = process.env['MINIO_INTERNAL_HOST'] || 'minio:9000';
const MINIO_PUBLIC_URL = process.env['MINIO_PUBLIC_URL'] || process.env['STORAGE_ENDPOINT'] || 'http://localhost:9000';

/**
 * Converts an internal Docker MinIO URL (e.g. http://minio:9000/...) to the
 * publicly accessible URL so that external services (Gemini API) can fetch it.
 * Reads MINIO_INTERNAL_HOST and MINIO_PUBLIC_URL from env at call time.
 */
export function toPublicUrl(internalUrl: string): string {
  if (!internalUrl) return internalUrl;
  if (internalUrl.includes(MINIO_INTERNAL_HOST)) {
    return internalUrl
      .replace(`http://${MINIO_INTERNAL_HOST}`, MINIO_PUBLIC_URL)
      .replace(MINIO_INTERNAL_HOST, MINIO_PUBLIC_URL);
  }
  return internalUrl;
}
