export function getSofaRecipe(fabricName: string, tags: string[] = []): string {
  const safeTags = tags || [];
  const characteristics = safeTags.length > 0 ? `Characteristics: ${safeTags.join(', ')}.` : '';
  return `You are a strict photorealistic image editor. I have provided a [BASE_ROOM_TO_EDIT] image and a [FABRIC_SWATCH_REFERENCE]. Edit the [BASE_ROOM_TO_EDIT] image to drape the sofa perfectly in ${fabricName} fabric. ${characteristics}
KEEP EVERY OTHER PIXEL EXACTLY THE SAME. Do not generate a new room.
The fabric must conform tightly to the arm contours and seat seams, displaying realistic shadow depth and natural fabric tension.
Ensure the fabric pattern repeat scale and orientation are precisely maintained across all cushions.
Maintain realistic ambient room lighting, sharp focus, and premium interior design aesthetic. Output quality constraint: Generate the image at a maximum resolution of 1024x1024 (1k quality). Do not exceed 1k quality.`;
}

export function getCurtainRecipe(fabricName: string, tags: string[] = []): string {
  const safeTags = tags || [];
  const characteristics = safeTags.length > 0 ? `Characteristics: ${safeTags.join(', ')}.` : '';
  return `You are a strict photorealistic image editor. I have provided a [BASE_ROOM_TO_EDIT] image and a [FABRIC_SWATCH_REFERENCE]. Edit the [BASE_ROOM_TO_EDIT] image to replace the curtains with ${fabricName} fabric. ${characteristics}
KEEP EVERY OTHER PIXEL EXACTLY THE SAME. Do not generate a new room.
The fabric must hang with natural, deep vertical pleats, preserving realistic fold shadows and light absorption.
Ensure the pattern repeat is continuous and scaled correctly for a large drape.
Maintain realistic window lighting from behind the curtain, sharp focus, and premium interior design aesthetic. Output quality constraint: Generate the image at a maximum resolution of 1024x1024 (1k quality). Do not exceed 1k quality.`;
}

export function buildPrompt(objectType: string, fabricName: string, tags: string[] = []): string {
  switch (objectType) {
    case 'sofa':
      return getSofaRecipe(fabricName, tags);
    case 'curtain':
      return getCurtainRecipe(fabricName, tags);
    case 'rug':
      return `Generate a high-quality photorealistic image of a rug using ${fabricName} texture...`; // Stub for v2
    case 'wallpaper':
      return `Generate a high-quality photorealistic image of a wall covered in ${fabricName} wallpaper...`; // Stub for v2
    default:
      return `Apply ${fabricName} texture to the object.`;
  }
}
