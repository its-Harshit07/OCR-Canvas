let canvasCtx = null;

/**
 * Measure exact pixel width of text string in canonical document space
 * matching standard Canvas 2D font metrics.
 */
export function measureTextWidth(text, fontSize, fontFamily, fontWeight = 'normal', fontStyle = 'normal') {
  if (!text) return 0;
  if (typeof window === 'undefined') return 0;

  try {
    if (!canvasCtx) {
      const canvas = document.createElement('canvas');
      canvasCtx = canvas.getContext('2d');
    }

    const weight = typeof fontWeight === 'number'
      ? fontWeight
      : (fontWeight === 'bold' || fontWeight === '700' ? 700 : 400);
    const style = fontStyle || 'normal';
    const size = Math.max(8, fontSize || 14);
    const family = fontFamily || 'Inter, Arial, sans-serif';

    canvasCtx.font = `${style} ${weight} ${size}px ${family}`;
    const metrics = canvasCtx.measureText(text);
    return Math.ceil(metrics.width);
  } catch (e) {
    // Fallback estimation if canvas context fails
    const charWidth = (fontSize || 14) * 0.6;
    return Math.ceil(text.length * charWidth);
  }
}
