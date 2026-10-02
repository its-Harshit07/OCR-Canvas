// Structured Font Registry for Document & Graphic Typesetting

export const FONT_CATEGORIES = {
  DOCUMENT: [
    { label: 'Arial', value: 'Arial, sans-serif' },
    { label: 'Calibri', value: 'Calibri, Arial, sans-serif' },
    { label: 'Cambria', value: 'Cambria, Georgia, serif' },
    { label: 'Times New Roman', value: 'Times New Roman, Times, serif' },
    { label: 'Georgia', value: 'Georgia, serif' },
    { label: 'Verdana', value: 'Verdana, sans-serif' },
    { label: 'Tahoma', value: 'Tahoma, sans-serif' },
    { label: 'Trebuchet MS', value: 'Trebuchet MS, sans-serif' },
    { label: 'Segoe UI', value: 'Segoe UI, sans-serif' },
    { label: 'Aptos', value: 'Aptos, Calibri, sans-serif' },
    { label: 'Aptos Display', value: 'Aptos Display, Segoe UI, sans-serif' },
  ],
  GOOGLE: [
    { label: 'Roboto', value: 'Roboto, sans-serif' },
    { label: 'Roboto Condensed', value: 'Roboto Condensed, sans-serif' },
    { label: 'Open Sans', value: 'Open Sans, sans-serif' },
    { label: 'Lato', value: 'Lato, sans-serif' },
    { label: 'Montserrat', value: 'Montserrat, sans-serif' },
    { label: 'Poppins', value: 'Poppins, sans-serif' },
    { label: 'Inter (Default)', value: 'Inter, Arial, sans-serif' },
    { label: 'Nunito', value: 'Nunito, sans-serif' },
    { label: 'Source Sans 3', value: 'Source Sans 3, sans-serif' },
    { label: 'Noto Sans', value: 'Noto Sans, sans-serif' },
    { label: 'Noto Serif', value: 'Noto Serif, serif' },
  ],
  SERIF: [
    { label: 'Georgia', value: 'Georgia, serif' },
    { label: 'Times New Roman', value: 'Times New Roman, serif' },
    { label: 'Cambria', value: 'Cambria, serif' },
    { label: 'Garamond', value: 'Garamond, serif' },
  ],
  MONOSPACE: [
    { label: 'Consolas', value: 'Consolas, monospace' },
    { label: 'Courier New', value: 'Courier New, monospace' },
    { label: 'Roboto Mono', value: 'Roboto Mono, monospace' },
    { label: 'Source Code Pro', value: 'Source Code Pro, monospace' },
  ],
  SYSTEM: [
    { label: 'System UI', value: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' },
  ]
};

// Flattened list for select options
export const ALL_FONTS = [
  ...FONT_CATEGORIES.DOCUMENT,
  ...FONT_CATEGORIES.GOOGLE,
  ...FONT_CATEGORIES.SERIF,
  ...FONT_CATEGORIES.MONOSPACE,
  ...FONT_CATEGORIES.SYSTEM,
];

// Helper to query local fonts safely
export async function getLocalInstalledFonts() {
  if (typeof window === 'undefined' || !('queryLocalFonts' in window)) {
    return { supported: false, fonts: [] };
  }

  try {
    const availableFonts = await window.queryLocalFonts();
    const uniqueFamilies = new Set();
    const fontList = [];

    for (const font of availableFonts) {
      if (font.family && !uniqueFamilies.has(font.family)) {
        uniqueFamilies.add(font.family);
        fontList.push({
          label: font.family,
          value: `"${font.family}", sans-serif`,
          isLocal: true,
        });
      }
    }

    return { supported: true, fonts: fontList };
  } catch (err) {
    console.warn('Local Font Access denied or unavailable:', err);
    return { supported: true, error: err.message, fonts: [] };
  }
}
