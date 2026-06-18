export function getSofaRecipe(fabricName: string, tags: string[] = []): string {
  const safeTags = tags || [];
  const characteristics = safeTags.length > 0 ? `Characteristics: ${safeTags.join(', ')}.` : '';
  return `Generate a high-quality photorealistic image of a modern sofa draped perfectly in ${fabricName} fabric. ${characteristics}
The fabric must conform tightly to the arm contours and seat seams, displaying realistic shadow depth and natural fabric tension.
Ensure the fabric pattern repeat scale and orientation are precisely maintained across all cushions.
Maintain realistic ambient room lighting, sharp focus, and premium interior design aesthetic. No extra elements.`;
}

export function getCurtainRecipe(fabricName: string, tags: string[] = []): string {
  const safeTags = tags || [];
  const characteristics = safeTags.length > 0 ? `Characteristics: ${safeTags.join(', ')}.` : '';
  return `Generate a high-quality photorealistic image of floor-to-length curtains made of ${fabricName} fabric. ${characteristics}
The fabric must hang with natural, deep vertical pleats, preserving realistic fold shadows and light absorption.
Ensure the pattern repeat is continuous and scaled correctly for a large drape.
Maintain realistic window lighting from behind the curtain, sharp focus, and premium interior design aesthetic. No extra elements.`;
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
