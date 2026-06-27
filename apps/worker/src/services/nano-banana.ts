export interface NanoBananaResponse {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

import { uploadFile } from './storage-service.js';

export class NanoBananaService {
  private apiKey: string;
  private apiUrl: string;
  private useMock: boolean;

  constructor() {
    const rawKey = process.env.NANO_BANANA_API_KEY || '';
    this.apiKey = rawKey;
    this.apiUrl = process.env.NANO_BANANA_API_URL || 'https://api.nanobanana.ai/v2';
    this.useMock = !rawKey || rawKey === 'mock';

    if (this.useMock) {
      console.log('[NanoBanana] Running in MOCK mode (API key absent, empty, or set to "mock").');
    } else {
      console.log(`[NanoBanana] Running in LIVE mode against ${this.apiUrl}.`);
    }
  }

  async generateImage(prompt: string, sourceImageUrl?: string | null, model: 'fast' | 'pro' = 'fast'): Promise<NanoBananaResponse> {
    if (this.useMock) {
      return this.generateImageMock(prompt);
    }
    return this.generateImageReal(prompt, sourceImageUrl, model);
  }

  // ── Real API implementation ────────────────────────────────────────────
  private async generateImageReal(prompt: string, sourceImageUrl?: string | null, model: 'fast' | 'pro' = 'fast'): Promise<NanoBananaResponse> {
    console.log(`[NanoBanana] LIVE call — prompt: ${prompt.substring(0, 50)}...`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60_000);

    try {
      // Check if we are using Gemini API key (starts with AIza or AQ.)
      const isGeminiKey = this.apiKey.startsWith('AIza') || this.apiKey.startsWith('AQ.');
      
      let response: Response;
      
      if (isGeminiKey) {
        // Use Google AI Studio Imagen 4.0 API
        console.log(`[NanoBanana] Using Google AI Studio Imagen API (${model})`);
        const modelEndpoint = model === 'fast' ? 'imagen-4.0-fast-generate-001' : 'imagen-4.0-generate-001';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelEndpoint}:predict?key=${this.apiKey}`;
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            instances: [{ prompt }],
            parameters: { sampleCount: 1 }
          }),
          signal: controller.signal,
        });
      } else {
        const body: Record<string, string> = { prompt };
        if (sourceImageUrl) {
          body.sourceImageUrl = sourceImageUrl;
        }

        response = await fetch(this.apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
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
        const data = await response.json() as any;
        if (data.predictions && data.predictions.length > 0) {
          const base64 = data.predictions[0].bytesBase64Encoded || data.predictions[0].bytesBase64;
          const mimeType = data.predictions[0].mimeType || 'image/png';
          const buffer = Buffer.from(base64, 'base64');
          
          const uploadedUrl = await uploadFile(buffer, 'generated.png', mimeType);
          
          return { success: true, imageUrl: uploadedUrl };
        } else {
          return { success: false, error: 'Google AI Studio returned no predictions.' };
        }
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

  // ── Mock implementation (3-5s delay, 10% failure, Unsplash URLs) ───────
  private async generateImageMock(prompt: string): Promise<NanoBananaResponse> {
    console.log(`[NanoBanana] MOCK call — prompt: ${prompt.substring(0, 50)}...`);

    // Simulate network delay for rendering (3-5 seconds)
    await new Promise((resolve) => setTimeout(resolve, 3000 + Math.random() * 2000));

    // Simulate random failures (10% chance) for testing retries
    if (Math.random() < 0.1) {
      return { success: false, error: 'NanoBanana API Timeout or Connection Error' };
    }

    // Return a realistic looking placeholder based on the prompt type for now
    let mockUrl = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=800'; // Default sofa
    if (prompt.toLowerCase().includes('curtain')) {
      mockUrl = 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=800'; // Default curtain
    }

    return {
      success: true,
      imageUrl: mockUrl,
    };
  }
}
