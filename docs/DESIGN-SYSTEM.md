# FabricViz Design System

This document serves as the definitive source of truth for the FabricViz design language. All frontend packages (`apps/web`, `apps/website`) MUST strictly adhere to these guidelines. Hardcoded hex colors and inline styling are strictly prohibited; developers must always use the Tailwind utilities defined below.

## 1. Typography

FabricViz uses a two-font system to balance premium aesthetic appeal with functional legibility.

- **Serif (Headings)**: `Cormorant Garamond` (Weights: 400, 500, 600, 700)
- **Sans-serif (Body & UI)**: `Inter` (Weights: 300, 400, 500, 600)

### Tailwind Classes
- Heading Font: `font-serif`
- Body Font: `font-sans`

## 2. Color Palette

The color system is mapped as custom properties in `tailwind.config.js` and `index.css`/`globals.css`.

| Token Name | Hex Value | Tailwind Class | Usage |
|---|---|---|---|
| **brand-bg** | `#FDFAF6` | `bg-brand-bg` | Warm off-white for all primary page backgrounds. |
| **brand-dark** | `#1E1A14` | `bg-brand-dark` | Near-black for dark sections and the admin sidebar. |
| **brand-accent** | `#C9A060` | `bg-brand-accent`, `text-brand-accent` | Warm gold for active states, highlights, and hovers. |
| **brand-terracotta**| `#C75B3A` | `bg-brand-terracotta` | Deep red-orange for primary action buttons and badges. |
| **brand-alt** | `#F2EDE4` | `bg-brand-alt` | Grey-beige for secondary backgrounds (cards, alternating rows). |
| **brand-text** | `#1C1C1C` | `text-brand-text` | Primary dark text for high legibility on light backgrounds. |
| **brand-muted** | `#6B6355` | `text-brand-muted` | Secondary text for subtitles, placeholders, and descriptions. |
| **brand-forest** | `#1A2E1E` | `bg-brand-forest`, `text-brand-forest` | Deep green for success states or specialized accents. |

## 3. UI Components

### Buttons
All buttons should use the Shadcn/UI `<Button>` component with the predefined variants.

- **Primary Button (`variant="default"`)**:
  - Purpose: Main CTAs (e.g., "Visualize", "Sign In").
  - Styling: `bg-brand-terracotta text-white uppercase tracking-widest font-bold`.
  - Hover: `hover:opacity-90`.

- **Secondary Button (`variant="secondary"`)**:
  - Purpose: Alternative actions.
  - Styling: `border border-brand-text/30 text-brand-text uppercase tracking-widest font-bold`.
  - Hover: `hover:bg-brand-alt`.

### Cards & Containers
- Standard cards use `bg-brand-alt` with a subtle `border-black/5` and `shadow-sm`.
- Form inputs feature a `border-brand-muted/30` border and focus with a `ring-brand-accent`.

### Admin Dashboard
- Sidebar Background: `bg-brand-dark`
- Sidebar Text: `text-white/70`
- Active Sidebar Item: `bg-white/10 text-brand-accent`
- Alternating Table Rows: `bg-white` and `bg-brand-alt`

## 4. Implementation Rules

1. **Never use generic Tailwind colors** (e.g., `text-gray-500`, `bg-blue-600`) for structural or branded elements. If it is structural UI, map it to a brand token.
2. **Never hardcode hex values** in `className` strings or inline `style={{}}` attributes.
3. Ensure all Next.js applications and Vite packages share these exact tokens.
