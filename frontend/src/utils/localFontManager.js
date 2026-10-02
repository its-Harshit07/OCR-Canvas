// Local Font Manager - Real Browser-level Local Font Access API integration

export function isLocalFontApiSupported() {
  return typeof window !== 'undefined' && 'queryLocalFonts' in window;
}

export async function checkLocalFontPermissionState() {
  if (typeof navigator === 'undefined' || !navigator.permissions || !navigator.permissions.query) {
    return 'unknown';
  }
  try {
    const status = await navigator.permissions.query({ name: 'local-fonts' });
    return status.state; // 'granted', 'prompt', 'denied'
  } catch (e) {
    return 'unknown';
  }
}

export async function requestLocalDeviceFonts() {
  if (!isLocalFontApiSupported()) {
    return {
      supported: false,
      state: 'unsupported',
      message: 'Your browser does not support secure local-font access. The editor will use available web/system fonts instead.',
      fonts: []
    };
  }

  try {
    // Calling queryLocalFonts directly inside explicit user action handler
    const availableFonts = await window.queryLocalFonts();
    
    const fontFaces = [];
    const fontFamiliesSet = new Set();

    for (const font of availableFonts) {
      if (!font.family) continue;
      
      fontFamiliesSet.add(font.family);

      // Derive font weight & style from font.style string (e.g. "Bold", "Italic", "Medium Italic", "Regular")
      const styleStr = (font.style || '').toLowerCase();
      let weight = 400;
      let fontStyle = 'normal';

      if (styleStr.includes('bold')) weight = 700;
      if (styleStr.includes('heavy') || styleStr.includes('black')) weight = 900;
      if (styleStr.includes('semibold') || styleStr.includes('demi')) weight = 600;
      if (styleStr.includes('medium')) weight = 500;
      if (styleStr.includes('light')) weight = 300;
      if (styleStr.includes('thin')) weight = 100;
      
      if (styleStr.includes('italic') || styleStr.includes('oblique')) {
        fontStyle = 'italic';
      }

      fontFaces.push({
        family: font.family,
        fullName: font.fullName || font.family,
        postscriptName: font.postscriptName || font.family,
        style: font.style || 'Regular',
        weight,
        fontStyle,
        source: 'local',
        getBlob: font.blob ? () => font.blob() : null
      });
    }

    return {
      supported: true,
      state: 'granted',
      message: `Successfully registered ${fontFaces.length} device font faces across ${fontFamiliesSet.size} families!`,
      fonts: fontFaces,
      families: Array.from(fontFamiliesSet)
    };
  } catch (err) {
    console.warn('Local font access permission error:', err);
    return {
      supported: true,
      state: err.name === 'NotAllowedError' ? 'denied' : 'error',
      message: err.name === 'NotAllowedError'
        ? 'Local font access permission was denied.'
        : `Could not load local fonts: ${err.message}`,
      fonts: []
    };
  }
}
