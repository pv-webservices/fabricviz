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

  public async generateImage(prompt: string, sourceImageUrl?: string | null, model: 'fast' | 'pro' = 'fast', referenceImageUrls: string[] = []): Promise<NanoBananaResponse> {
    if (this.useMock) {
      return this.generateImageMock(prompt);
    }
    return this.generateImageReal(prompt, sourceImageUrl, model, referenceImageUrls);
  }

  // ── Real API implementation ────────────────────────────────────────────
  private async generateImageReal(prompt: string, sourceImageUrl?: string | null, model: 'fast' | 'pro' = 'fast', referenceImageUrls: string[] = []): Promise<NanoBananaResponse> {
    console.log(`[NanoBanana] LIVE call — prompt: ${prompt.substring(0, 50)}...`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60_000);

    try {
      // Check if we are using Gemini API key (starts with AIza or AQ.)
      const isGeminiKey = this.apiKey.startsWith('AIza') || this.apiKey.startsWith('AQ.');
      
      let response: Response;
      if (isGeminiKey) {
        // Use Google AI Studio Gemini Image API (Nano Banana models)
        console.log(`[NanoBanana] Using Google AI Studio Gemini API (${model})`);
        const modelEndpoint = model === 'fast' ? 'gemini-3.1-flash-image' : 'gemini-3-pro-image';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelEndpoint}:generateContent?key=${this.apiKey}`;
        
        let parts: any[] = [{ text: "INSTRUCTIONS:\n" + prompt + "\n\n" }];
        
        // Helper function to fetch and encode image
        const fetchAndEncode = async (url: string, label: string) => {
          try {
            console.log(`[NanoBanana] Fetching ${label} image: ${url}`);
            const imgRes = await fetch(url);
            if (!imgRes.ok) throw new Error(`HTTP ${imgRes.status}`);
            const arrayBuffer = await imgRes.arrayBuffer();
            const base64Data = Buffer.from(arrayBuffer).toString('base64');
            const mimeType = imgRes.headers.get('content-type') || 'image/jpeg';
            
            parts.push({ text: `\n--- [${label}] ---\n` });
            parts.push({
              inlineData: {
                mimeType,
                data: base64Data
              }
            });
            console.log(`[NanoBanana] Attached ${label} image (${Math.round(base64Data.length / 1024)} KB)`);
          } catch (e) {
            console.error(`[NanoBanana] Failed to fetch ${label} image:`, e);
          }
        };

        if (sourceImageUrl) {
          await fetchAndEncode(sourceImageUrl, "BASE_ROOM_TO_EDIT");
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
            generationConfig: { responseModalities: ["IMAGE"] }
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
        if (data.error) {
          return { success: false, error: `Gemini API Error: ${data.error.message}` };
        }
        
        const imgPart = data.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
        if (!imgPart) {
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
