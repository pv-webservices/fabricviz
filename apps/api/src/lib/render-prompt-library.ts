/**
 * render-prompt-library.ts
 * -----------------------------------------------------------------------------
 * SINGLE SOURCE OF TRUTH for all AI image generation prompts used in rendering.
 * The BullMQ worker MUST import and use ONLY this file to build prompts.
 * Never inline prompt strings in the worker or routes.
 *
 * Pure TypeScript � no side effects. Safe to import in tests.
 * -----------------------------------------------------------------------------
 */

// -- Types ---------------------------------------------------------------------

export interface AreaPromptFragment {
  areaKey: string;
  objectDescription: string;
  drapingInstruction: string;
  materialContext: string;
}

export interface AreaAssignment {
  areaKey: string;
  fabricId: string;
  fabricName: string;
  fabricCode: string;
  fabricColorDescription: string;
  fabricTextureDescription: string;
  fabricImageUrl: string | null;
}

export interface ModelConfig {
  modelId: string;
  displayName: string;
  description: string;
  apiEndpoint: string;
}

// -- AREA_PROMPT_FRAGMENTS -----------------------------------------------------

export const AREA_PROMPT_FRAGMENTS: Record<string, AreaPromptFragment> = {
  sofa_seat: {
    areaKey: 'sofa_seat',
    objectDescription: 'the seat cushions of the sofa',
    drapingInstruction:
      'In the source photograph provided above, replace the upholstery fabric covering the seat cushions with the provided textile swatch, ensuring exact color precision and fabric quality match, maintaining realistic fabric folds, tuck lines, and seat compression creases',
    materialContext:
      'upholstery fabric � tight weave, minimal drape, compresses under weight',
  },

  sofa_back: {
    areaKey: 'sofa_back',
    objectDescription: 'the back panel and backrest cushions of the sofa',
    drapingInstruction:
      'In the source photograph provided above, replace the upholstery on the sofa backrest with the provided textile swatch, ensuring exact color precision and fabric quality match, preserving button tufting detail if present, realistic fold shadows, and vertical alignment of fabric grain',
    materialContext: 'upholstery fabric � structured drape, medium stiffness',
  },

  sofa_all: {
    areaKey: 'sofa_all',
    objectDescription: 'the entire sofa including seat cushions, backrest, and armrests',
    drapingInstruction:
      'In the source photograph provided above, re-upholster the entire sofa with the provided textile swatch as a continuous fabric, ensuring exact color precision and fabric quality match, wrapping naturally over arms, back, and seat with realistic tension lines and corner folding',
    materialContext:
      'upholstery fabric � continuous surface treatment, edge wrapping required',
  },

  front_curtain: {
    areaKey: 'front_curtain',
    objectDescription: 'the sheer or lightweight curtain panel in the foreground',
    drapingInstruction:
      'In the source photograph provided above, replace the front curtain panel fabric with the provided textile swatch, ensuring exact color precision and fabric quality match, showing natural vertical pleating, light diffusion, and soft cascade folds falling from the curtain rod to the floor',
    materialContext:
      'sheer or semi-sheer curtain fabric � high drape, light transmission, fine pleats',
  },

  back_curtain: {
    areaKey: 'back_curtain',
    objectDescription: 'the heavier curtain or drape panel behind the sheer, framing the window',
    drapingInstruction:
      'In the source photograph provided above, replace the back drape panel with the provided textile swatch, ensuring exact color precision and fabric quality match, showing deep formal pleats (pinch pleat or goblet pleat), rich fabric weight, and floor-length formal hang',
    materialContext:
      'heavy drapery fabric � structured pleats, weighted hem, rich texture',
  },

  headboard: {
    areaKey: 'headboard',
    objectDescription: 'the upholstered headboard panel at the head of the bed',
    drapingInstruction:
      'In the source photograph provided above, replace the headboard upholstery with the provided textile swatch, ensuring exact color precision and fabric quality match, wrapping fabric tightly over the headboard frame with smooth tension, piped edges if present, and realistic padding depth',
    materialContext:
      'headboard upholstery � smooth or textured tight cover, padded depth visible',
  },

  cushion: {
    areaKey: 'cushion',
    objectDescription: 'the decorative throw cushions and accent pillows on the sofa or bed',
    drapingInstruction:
      'In the source photograph provided above, replace the cushion cover fabric with the provided textile swatch, ensuring exact color precision and fabric quality match, showing natural plumpness, corner stitching visible, and fabric draping slightly over cushion edges',
    materialContext:
      'cushion cover fabric � medium weight, slightly loose weave, pillow-form shape',
  },

  rug: {
    areaKey: 'rug',
    objectDescription: 'the area rug or floor carpet defining the seating or room zone',
    drapingInstruction:
      'In the source photograph provided above, replace the rug with the provided textile swatch rendered as a flat woven rug, ensuring exact color precision and fabric quality match, showing pile texture, border detail if applicable, and correct perspective foreshortening for floor plane',
    materialContext:
      'woven rug textile � flat to medium pile, perspective-correct floor plane',
  },

  floor: {
    areaKey: 'floor',
    objectDescription: 'the entire visible floor surface of the room',
    drapingInstruction:
      'In the source photograph provided above, replace the flooring material with the provided textile or material swatch, ensuring exact color precision and quality match, tiling realistically across the floor plane with correct perspective, grout lines or weave repeat as appropriate',
    materialContext:
      'floor covering � tiled repeat pattern, perspective foreshortening, consistent scale',
  },

  accent_wall: {
    areaKey: 'accent_wall',
    objectDescription: 'the single designated accent wall in the background or side of the room',
    drapingInstruction:
      'In the source photograph provided above, apply the provided textile or wallcovering swatch to the accent wall surface only, ensuring exact color precision and quality match, maintaining wall plane geometry, corner transitions, and realistic surface texture and scale',
    materialContext:
      'wall textile or wallcovering � flat surface application, pattern repeat at wall scale',
  },

  all_walls: {
    areaKey: 'all_walls',
    objectDescription: 'all visible wall surfaces in the room',
    drapingInstruction:
      'In the source photograph provided above, apply the provided textile or wallcovering swatch uniformly to all visible wall surfaces, ensuring exact color precision and quality match, maintaining consistent scale, corner transitions, and realistic texture across the room',
    materialContext:
      'wallcovering � full-room surface treatment, consistent pattern repeat',
  },
};

// -- MODEL_CONFIG --------------------------------------------------------------

export const MODEL_CONFIG: Record<'fast' | 'pro', ModelConfig> = {
  fast: {
    modelId: process.env['NANO_BANANA_FAST_MODEL_ID'] ?? 'nano-banana-2.0',
    displayName: 'Fast',
    description: 'Nano Banana 2.0 � faster generation, great for previews',
    apiEndpoint: process.env['NANO_BANANA_API_URL'] ?? 'https://api.nanobanana.ai/v1/render',
  },
  pro: {
    modelId: process.env['NANO_BANANA_PRO_MODEL_ID'] ?? 'nano-banana-pro',
    displayName: 'Pro',
    description: 'Nano Banana Pro � highest quality, production renders',
    apiEndpoint: process.env['NANO_BANANA_API_URL'] ?? 'https://api.nanobanana.ai/v1/render',
  },
};

// -- buildSceneLockDirective ---------------------------------------------------

export function buildSceneLockDirective(
  sourceType: 'predefined_room' | 'uploaded_photo',
  roomImageUrl: string,
  fabricSwatchUrls: string[]
): string {
  const p1 =
    'CRITICAL INSTRUCTION � IMAGE EDITING MODE ONLY: You are NOT generating a new image. ' +
    'You are editing an existing photograph. The source room image is the base � every ' +
    'pixel of the room, furniture geometry, walls, ceiling, floor, lighting, shadows, ' +
    'ambient occlusion, camera perspective, decorative objects, and all untargeted ' +
    'surfaces must remain completely unchanged. Your only task is to replace the ' +
    'material/fabric on the specifically listed surfaces. Nothing else changes.';

  const p2 =
    sourceType === 'predefined_room'
      ? `Source photograph to edit: ${roomImageUrl}. This is a professionally staged interior ` +
        `room photograph. Treat its spatial geometry, furniture placement, architectural ` +
        `elements, and lighting as absolute ground truth. Output must be this exact ` +
        `photograph with only the target surfaces re-upholstered.`
      : `Source photograph to edit: ${roomImageUrl}. This is a user-provided interior ` +
        `photograph. The room may be casually lit or taken from a non-standard angle. ` +
        `Regardless, treat ALL non-target surfaces as immutable � apply fabric replacements ` +
        `faithfully to whatever perspective and lighting exist in this specific photograph.`;

  const p3Array = fabricSwatchUrls.map(
    (url, idx) =>
      `Fabric swatch reference image ${idx + 1}: ${url}. Use this exact swatch ` +
      `image to determine the fabric's color, texture, weave pattern, and sheen. Do not ` +
      `approximate or guess the fabric appearance � replicate it precisely from this ` +
      `swatch image.`
  );
  const p3 = p3Array.join('\n');

  const p4 =
    'Output constraint: Generate the edited room image at maximum 1024x1024 pixels. ' +
    'Photorealistic quality only � no illustration, painting, or artistic filter style. ' +
    'The output must be indistinguishable from a real interior photograph with new ' +
    'fabric applied.';

  return [p1, p2, p3, p4].filter(Boolean).join('\n\n');
}

// -- buildRenderPrompt ---------------------------------------------------------

/**
 * Builds the final prompt string from an array of area assignments.
 *
 * @param assignments - Array of fabric-to-area assignments from the frontend payload.
 * @param model - 'fast' | 'pro' � model-specific quality note is prepended for 'pro'.
 * @param sourceType - 'predefined_room' | 'uploaded_photo'
 * @param roomImageUrl - The resolved public URL of the room/uploaded photo.
 * @param fabricSwatchUrls - Array of resolved public URLs of fabric swatch images.
 * @returns Fully composed prompt string ready to send to the Nano Banana API.
 */
export function buildRenderPrompt(
  assignments: AreaAssignment[],
  model: 'fast' | 'pro',
  sourceType: 'predefined_room' | 'uploaded_photo',
  roomImageUrl: string,
  fabricSwatchUrls: string[]
): string {
  const areaBlocks: string[] = assignments.map((assignment, idx) => {
    const fragment = AREA_PROMPT_FRAGMENTS[assignment.areaKey];
    const swatchLabel = `[FABRIC_SWATCH_REFERENCE_${idx + 1}]`;

    if (!fragment) {
      return `Apply ${assignment.fabricName} (${assignment.fabricCode}) from ${swatchLabel} to the selected area.`;
    }

    const colorPart = assignment.fabricColorDescription
      ? `, color: ${assignment.fabricColorDescription}`
      : '';
    const texturePart = assignment.fabricTextureDescription
      ? `, texture: ${assignment.fabricTextureDescription}`
      : '';

    return (
      `Area: ${assignment.areaKey} → use ${swatchLabel} (${assignment.fabricName}, ${assignment.fabricCode}). ` +
      `For ${fragment.objectDescription}: ${fragment.drapingInstruction}. ` +
      `Fabric details: ${assignment.fabricName} (${assignment.fabricCode})${colorPart}${texturePart}. ` +
      `Material behavior: ${fragment.materialContext}.`
    );
  });

  const allBlocks = areaBlocks.join('\n');
  const modelNote = model === 'pro' ? 'Render quality: maximum fidelity, production grade.\n' : '';
  const sceneLock = buildSceneLockDirective(sourceType, roomImageUrl, fabricSwatchUrls);

  return `${modelNote}${allBlocks}\n\n${sceneLock}`;
}

