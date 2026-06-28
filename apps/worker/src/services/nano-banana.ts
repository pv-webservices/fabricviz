export interface NanoBananaResponse {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

import { uploadFile } from './storage-service.js';

const MINIO_INTERNAL_HOST = process.env['MINIO_INTERNAL_HOST'] || 'minio:9000';
const MINIO_PUBLIC_URL = process.env['MINIO_PUBLIC_URL'] || process.env['STORAGE_ENDPOINT'] || 'http://localhost:9000';

function rewriteInternalUrl(url: string): string {
  if (url.startsWith('/uploads/')) {
    const apiUrl = process.env['API_URL'] || 'http://localhost:4000';
    return `${apiUrl}${url}`;
  }
  if (url.includes(MINIO_INTERNAL_HOST)) {
    const rewritten = url
      .replace(`http://${MINIO_INTERNAL_HOST}`, MINIO_PUBLIC_URL)
      .replace(MINIO_INTERNAL_HOST, MINIO_PUBLIC_URL);
    console.log(`[NanaBanana] Rewrote internal MinIO URL to public URL: ${rewritten}`);
    return rewritten;
  }
  return url;
}

export class NanoBananaService {
  private apiKey: string;
  private apiUrl: string;
  private useMock: boolean;

  constructor() {
    const rawKey = process.env['NANO_BANANA_API_KEY'] || '';
    this.apiKey = rawKey;
    this.apiUrl = process.env['NANO_BANANA_API_URL'] || 'https://api.nanobanana.ai/v2';

    // BUG 1 FIX: only treat as mock if key is absent, empty, or literally "mock"
    // Keys starting with AIza or AQ. are real Gemini keys → LIVE mode
    const isRealGeminiKey = rawKey.startsWith('AIza') || rawKey.startsWith('AQ.');
    this.useMock = !rawKey || rawKey === 'mock' || (!isRealGeminiKey && rawKey === 'your_nano_banana_key_here');

    if (this.useMock) {
      console.log('[NanaBanana] ⚠ MOCK MODE ACTIVE — set NANO_BANANA_API_KEY in .env to use real AI');
      console.log('[NanaBanana] Mode: MOCK | No real API key detected');
    } else {
      const keyPrefix = rawKey.substring(0, 8);
      const modeLabel = isRealGeminiKey ? 'Gemini (Google AI Studio)' : 'NanaBanana native';
      console.log(`[NanaBanana] Mode: LIVE | Provider: ${modeLabel} | Key prefix: ${keyPrefix}... | Endpoint: ${this.apiUrl}`);
    }
  }

  public async generateImage(
    prompt: string,
    sourceImageUrl?: string | null,
    model: 'fast' | 'pro' = 'fast',
    referenceImageUrls: string[] = [],
  ): Promise<NanoBananaResponse> {
    if (this.useMock) {
      return this.generateImageMock(prompt, sourceImageUrl, referenceImageUrls);
    }
    return this.generateImageReal(prompt, sourceImageUrl, model, referenceImageUrls);
  }

  // ── Real API implementation ────────────────────────────────────────────
  private async generateImageReal(
    prompt: string,
    sourceImageUrl?: string | null,
    model: 'fast' | 'pro' = 'fast',
    referenceImageUrls: string[] = [],
  ): Promise<NanoBananaResponse> {

    // Diagnostic log before any API call
    console.log('[NanaBanana] === RENDER DIAGNOSTIC ===');
    console.log('[NanaBanana] sourceImageUrl (room):', sourceImageUrl ?? 'NONE — NO ROOM IMAGE!');
    console.log('[NanaBanana] referenceImageUrls count:', referenceImageUrls.length);
    referenceImageUrls.forEach((url, i) => {
      console.log(`[NanaBanana] fabricSwatch[${i}]:`, url);
    });
    console.log('[NanaBanana] prompt (first 200 chars):', prompt.substring(0, 200));
    console.log('[NanaBanana] === END DIAGNOSTIC ===');

    console.log(`[NanaBanana] LIVE call — prompt: ${prompt.substring(0, 50)}...`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60_000);

    try {
      const isGeminiKey = this.apiKey.startsWith('AIza') || this.apiKey.startsWith('AQ.');

      let response: Response;
      if (isGeminiKey) {
        console.log(`[NanaBanana] Using Google AI Studio Gemini API (${model})`);
        const modelEndpoint = model === 'fast' ? 'gemini-3.1-flash-image' : 'gemini-3-pro-image';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelEndpoint}:generateContent?key=${this.apiKey}`;

        const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
          { text: 'INSTRUCTIONS:\n' + prompt + '\n\n' },
        ];

        // Fetch and base64-encode an image, rewriting internal MinIO URLs first
        const fetchAndEncode = async (imgUrl: string, label: string): Promise<void> => {
          const publicUrl = rewriteInternalUrl(imgUrl);
          console.log(`[NanaBanana] Fetching ${label} image: ${publicUrl}`);
          const imgRes = await fetch(publicUrl);
          if (!imgRes.ok) {
            throw new Error(`Failed to fetch ${label} image from ${publicUrl}: HTTP ${imgRes.status}`);
          }
          const arrayBuffer = await imgRes.arrayBuffer();
          const base64Data = Buffer.from(arrayBuffer).toString('base64');
          const mimeType = imgRes.headers.get('content-type') || 'image/jpeg';

          parts.push({ text: `\n--- [${label}] ---\n` });
          parts.push({ inlineData: { mimeType, data: base64Data } });
          console.log(`[NanaBanana] Attached ${label} image (${Math.round(base64Data.length / 1024)} KB)`);
        };

        if (sourceImageUrl) {
          await fetchAndEncode(sourceImageUrl, 'BASE_ROOM_TO_EDIT');
        }

        for (let i = 0; i < referenceImageUrls.length; i++) {
          const refUrl = referenceImageUrls[i];
          if (refUrl) {
            await fetchAndEncode(refUrl, `FABRIC_SWATCH_REFERENCE_${i + 1}`);
          }
        }

        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts }],
            generationConfig: { responseModalities: ['IMAGE'] },
          }),
          signal: controller.signal,
        });
      } else {
        const body: Record<string, string> = { prompt };
        if (sourceImageUrl) {
          body.sourceImageUrl = rewriteInternalUrl(sourceImageUrl);
        }

        response = await fetch(this.apiUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
      }

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        return {
          success: false,
          error: `API returned HTTP ${response.status}: ${text}`,
        };
      }

      if (isGeminiKey) {
        const data = (await response.json()) as {
          error?: { message: string };
          candidates?: Array<{
            content?: { parts?: Array<{ inlineData?: { data: string; mimeType: string } }> };
          }>;
        };
        if (data.error) {
          return { success: false, error: `Gemini API Error: ${data.error.message}` };
        }

        const imgPart = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
        if (!imgPart?.inlineData) {
          return { success: false, error: 'Google AI Studio returned no image data.' };
        }

        const base64 = imgPart.inlineData.data;
        const mimeType = imgPart.inlineData.mimeType || 'image/jpeg';
        const buffer = Buffer.from(base64, 'base64');

        const uploadedUrl = await uploadFile(buffer, 'generated.jpeg', mimeType);
        return { success: true, imageUrl: uploadedUrl };
      } else {
        const data = (await response.json()) as NanoBananaResponse;
        return data;
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return { success: false, error: 'API request timed out (60s).' };
      }
      const message = err instanceof Error ? err.message : String(err);
      return { success: false, error: `API error: ${message}` };
    } finally {
      clearTimeout(timeout);
    }
  }

  // ── Mock implementation ────────────────────────────────────────────────
  private async generateImageMock(
    prompt: string,
    sourceImageUrl?: string | null,
    referenceImageUrls: string[] = [],
  ): Promise<NanoBananaResponse> {
    // BUG 1 FIX: log all inputs so mock mode is debuggable
    console.log('[NanaBanana] ⚠ MOCK MODE ACTIVE — set NANO_BANANA_API_KEY in .env to use real AI');
    console.log('[NanaBanana MOCK] sourceImageUrl:', sourceImageUrl ?? 'NOT PROVIDED');
    console.log('[NanaBanana MOCK] referenceImageUrls:', referenceImageUrls);
    console.log('[NanaBanana MOCK] prompt snippet:', prompt.substring(0, 100));

    // Simulate network delay (3–5 seconds)
    await new Promise((resolve) => setTimeout(resolve, 3000 + Math.random() * 2000));

    // Simulate random failures (10% chance) for testing retries
    if (Math.random() < 0.1) {
      return { success: false, error: 'NanaBanana API Timeout or Connection Error' };
    }

    let mockUrl = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=800';
    if (prompt.toLowerCase().includes('curtain')) {
      mockUrl = 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=800';
    }

    return { success: true, imageUrl: mockUrl };
  }
}
