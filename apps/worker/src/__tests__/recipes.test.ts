import { describe, it, expect } from 'vitest';
import { buildPrompt } from '../recipes';

describe('Recipe Builder', () => {
  it('should generate a valid prompt for a sofa without tags', () => {
    const prompt = buildPrompt('sofa', 'Blue Velvet Fabric', null as any);
    expect(prompt).toContain('sofa');
    expect(prompt).toContain('Blue Velvet Fabric');
    expect(prompt).not.toContain('undefined');
    expect(prompt).not.toContain('null');
  });

  it('should include tags when provided', () => {
    const prompt = buildPrompt('sofa', 'Red Silk', ['shiny', 'luxurious', 'floral']);
    expect(prompt).toContain('shiny');
    expect(prompt).toContain('luxurious');
    expect(prompt).toContain('floral');
  });

  it('should fall back gracefully if objectType is unknown', () => {
    const prompt = buildPrompt('spaceship' as any, 'Silver Mylar', ['metallic']);
    // Even if it's unknown, it should just build a generic prompt
    expect(prompt).toContain('spaceship');
    expect(prompt).toContain('Silver Mylar');
    expect(prompt).toContain('metallic');
  });

  it('should handle extremely long fabric names safely', () => {
    const longName = 'A'.repeat(500);
    const prompt = buildPrompt('curtain', longName, ['sheer']);
    expect(prompt).toContain(longName);
    // As long as it doesn't throw and includes the name, it's structurally valid for the API to reject or accept
  });

  it('should handle special characters in fabric names', () => {
    const special = 'L\'Océan & "Sea" \\ / % 100$';
    const prompt = buildPrompt('rug', special, ['blue']);
    expect(prompt).toContain(special);
  });
  
  // Golden-image prompt snapshot validation
  it('should match the approved golden prompt template', () => {
    const prompt = buildPrompt('sofa', 'Classic Damask', ['traditional', 'woven']);
    // This string represents the exact signed-off prompt format. If someone accidentally changes the generator, this test fails.
    expect(prompt).toBe(`Generate a high-quality photorealistic image of a modern sofa draped perfectly in Classic Damask fabric. Characteristics: traditional, woven.\nThe fabric must conform tightly to the arm contours and seat seams, displaying realistic shadow depth and natural fabric tension.\nEnsure the fabric pattern repeat scale and orientation are precisely maintained across all cushions.\nMaintain realistic ambient room lighting, sharp focus, and premium interior design aesthetic. No extra elements.`);
  });
});
