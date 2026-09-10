/**
 * 45 Curated Presentation Fonts for Worship Slides & PPTX Export.
 *
 * Categories:
 * - system: 10 Universal system fonts supported natively across PowerPoint installations.
 * - sans: 12 Clean modern sans-serifs for lyrics, reading, and body text.
 * - serif: 8 Dignified classic serifs for scripture, sermon titles, and communion.
 * - display: 8 Bold, high-impact fonts for event themes, opening titles, and countdowns.
 * - script: 7 Elegant calligraphy, brush, and handwriting fonts for greetings and personal notes.
 */

export type FontCategory = 'system' | 'sans' | 'serif' | 'display' | 'script';

export interface FontDefinition {
  family: string;
  label: string;
  category: FontCategory;
  fallback: string;
  googleFont?: string;
}

export const FONT_CATEGORY_LABELS: Record<FontCategory, { en: string; id: string }> = {
  system: { en: 'System & PowerPoint Safe', id: 'Standar Sistem & PPTX' },
  sans: { en: 'Modern Sans-Serif', id: 'Sans-Serif Modern' },
  serif: { en: 'Dignified Serif', id: 'Serif Klasik & Sakral' },
  display: { en: 'Bold Display & Title', id: 'Display & Judul Besar' },
  script: { en: 'Script & Handwriting', id: 'Kaligrafi & Tulisan Tangan' },
};

export const FONT_CATALOG: FontDefinition[] = [
  // 1. System Safe / PPTX Universal (10 fonts)
  { family: 'Arial', label: 'Arial', category: 'system', fallback: 'sans-serif' },
  { family: 'Calibri', label: 'Calibri', category: 'system', fallback: 'sans-serif' },
  { family: 'Aptos', label: 'Aptos', category: 'system', fallback: 'sans-serif' },
  { family: 'Segoe UI', label: 'Segoe UI', category: 'system', fallback: 'sans-serif' },
  { family: 'Verdana', label: 'Verdana', category: 'system', fallback: 'sans-serif' },
  { family: 'Trebuchet MS', label: 'Trebuchet MS', category: 'system', fallback: 'sans-serif' },
  { family: 'Tahoma', label: 'Tahoma', category: 'system', fallback: 'sans-serif' },
  { family: 'Georgia', label: 'Georgia', category: 'system', fallback: 'serif' },
  { family: 'Times New Roman', label: 'Times New Roman', category: 'system', fallback: 'serif' },
  { family: 'Garamond', label: 'Garamond', category: 'system', fallback: 'serif' },

  // 2. Modern Sans-Serif (12 fonts)
  { family: 'Inter', label: 'Inter', category: 'sans', fallback: 'sans-serif', googleFont: 'Inter:wght@400;600;700' },
  { family: 'Roboto', label: 'Roboto', category: 'sans', fallback: 'sans-serif', googleFont: 'Roboto:wght@400;500;700' },
  { family: 'Open Sans', label: 'Open Sans', category: 'sans', fallback: 'sans-serif', googleFont: 'Open+Sans:wght@400;600;700' },
  { family: 'Lato', label: 'Lato', category: 'sans', fallback: 'sans-serif', googleFont: 'Lato:wght@400;700' },
  { family: 'Montserrat', label: 'Montserrat', category: 'sans', fallback: 'sans-serif', googleFont: 'Montserrat:wght@400;600;700;800' },
  { family: 'Poppins', label: 'Poppins', category: 'sans', fallback: 'sans-serif', googleFont: 'Poppins:wght@400;600;700' },
  { family: 'Nunito', label: 'Nunito', category: 'sans', fallback: 'sans-serif', googleFont: 'Nunito:wght@400;600;700' },
  { family: 'Raleway', label: 'Raleway', category: 'sans', fallback: 'sans-serif', googleFont: 'Raleway:wght@400;600;700' },
  { family: 'Oswald', label: 'Oswald', category: 'sans', fallback: 'sans-serif', googleFont: 'Oswald:wght@400;600;700' },
  { family: 'Barlow Condensed', label: 'Barlow Condensed', category: 'sans', fallback: 'sans-serif', googleFont: 'Barlow+Condensed:wght@400;600;700' },
  { family: 'DM Sans', label: 'DM Sans', category: 'sans', fallback: 'sans-serif', googleFont: 'DM+Sans:wght@400;500;700' },
  { family: 'Work Sans', label: 'Work Sans', category: 'sans', fallback: 'sans-serif', googleFont: 'Work+Sans:wght@400;600;700' },

  // 3. Dignified Serif (8 fonts)
  { family: 'Merriweather', label: 'Merriweather', category: 'serif', fallback: 'serif', googleFont: 'Merriweather:wght@400;700' },
  { family: 'Playfair Display', label: 'Playfair Display', category: 'serif', fallback: 'serif', googleFont: 'Playfair+Display:wght@400;600;700' },
  { family: 'Lora', label: 'Lora', category: 'serif', fallback: 'serif', googleFont: 'Lora:wght@400;600;700' },
  { family: 'Cinzel', label: 'Cinzel', category: 'serif', fallback: 'serif', googleFont: 'Cinzel:wght@400;600;700' },
  { family: 'Cormorant Garamond', label: 'Cormorant Garamond', category: 'serif', fallback: 'serif', googleFont: 'Cormorant+Garamond:wght@400;600;700' },
  { family: 'PT Serif', label: 'PT Serif', category: 'serif', fallback: 'serif', googleFont: 'PT+Serif:wght@400;700' },
  { family: 'EB Garamond', label: 'EB Garamond', category: 'serif', fallback: 'serif', googleFont: 'EB+Garamond:wght@400;600;700' },
  { family: 'Baskervville', label: 'Baskervville', category: 'serif', fallback: 'serif', googleFont: 'Baskervville:ital@0;1' },

  // 4. Bold Display & Title Impact (8 fonts)
  { family: 'Bebas Neue', label: 'Bebas Neue', category: 'display', fallback: 'sans-serif', googleFont: 'Bebas+Neue' },
  { family: 'Anton', label: 'Anton', category: 'display', fallback: 'sans-serif', googleFont: 'Anton' },
  { family: 'League Spartan', label: 'League Spartan', category: 'display', fallback: 'sans-serif', googleFont: 'League+Spartan:wght@600;700;800' },
  { family: 'Righteous', label: 'Righteous', category: 'display', fallback: 'sans-serif', googleFont: 'Righteous' },
  { family: 'Teko', label: 'Teko', category: 'display', fallback: 'sans-serif', googleFont: 'Teko:wght@500;600;700' },
  { family: 'Abril Fatface', label: 'Abril Fatface', category: 'display', fallback: 'serif', googleFont: 'Abril+Fatface' },
  { family: 'Alfa Slab One', label: 'Alfa Slab One', category: 'display', fallback: 'serif', googleFont: 'Alfa+Slab+One' },
  { family: 'Russo One', label: 'Russo One', category: 'display', fallback: 'sans-serif', googleFont: 'Russo+One' },

  // 5. Script & Handwriting (7 fonts)
  { family: 'Great Vibes', label: 'Great Vibes', category: 'script', fallback: 'cursive', googleFont: 'Great+Vibes' },
  { family: 'Pacifico', label: 'Pacifico', category: 'script', fallback: 'cursive', googleFont: 'Pacifico' },
  { family: 'Caveat', label: 'Caveat', category: 'script', fallback: 'cursive', googleFont: 'Caveat:wght@600;700' },
  { family: 'Dancing Script', label: 'Dancing Script', category: 'script', fallback: 'cursive', googleFont: 'Dancing+Script:wght@600;700' },
  { family: 'Sacramento', label: 'Sacramento', category: 'script', fallback: 'cursive', googleFont: 'Sacramento' },
  { family: 'Shadows Into Light', label: 'Shadows Into Light', category: 'script', fallback: 'cursive', googleFont: 'Shadows+Into+Light' },
  { family: 'Satisfy', label: 'Satisfy', category: 'script', fallback: 'cursive', googleFont: 'Satisfy' },
];

export const DEFAULT_FONT_FAMILY = 'Arial';

const FONT_MAP = new Map<string, FontDefinition>(
  FONT_CATALOG.map((f) => [f.family.toLowerCase(), f])
);

export function getFontDefinition(family: string | undefined): FontDefinition | undefined {
  if (!family) return undefined;
  return FONT_MAP.get(family.trim().toLowerCase());
}

export function getFontStack(family: string | undefined): string {
  const def = getFontDefinition(family);
  if (!def) return `"${DEFAULT_FONT_FAMILY}", sans-serif`;
  return `"${def.family}", ${def.fallback}`;
}

export function resolveCatalogFontFamily(fabricFamily: string | undefined): string {
  if (!fabricFamily) return DEFAULT_FONT_FAMILY;
  const match = fabricFamily.match(/"([^"]+)"/);
  const candidate = match?.[1] ?? fabricFamily.split(',')[0]?.trim();
  return getFontDefinition(candidate)?.family ?? candidate ?? DEFAULT_FONT_FAMILY;
}

export function getGoogleFontsStylesheetUrl(): string {
  const families = FONT_CATALOG.filter((f) => Boolean(f.googleFont))
    .map((f) => `family=${f.googleFont}`)
    .join('&');
  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}
