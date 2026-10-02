// Stage 2, 7 & 8: Font Candidate Database, Matcher & FontFace Loader Engine

import { ALL_FONTS, FONT_CATEGORIES } from './fontRegistry';

const fontMatchCache = new Map();
const loadedFontFaces = new Set();

export async function matchAndLoadBestFontCandidate(element, visualProfile, localDeviceFonts = []) {
  if (!element || !visualProfile) {
    return {
      fontFamily: element?.fontFamily || 'Inter, Arial, sans-serif',
      fontWeight: visualProfile?.fontWeight || 400,
      fontStyle: visualProfile?.fontStyle || 'normal',
      fontStretch: visualProfile?.fontStretch || 'normal',
      confidence: 0.5,
      candidateScores: []
    };
  }

  // Cache lookup
  const cacheKey = `${element.id}-${element.text}-${element.width}-${visualProfile.fontWeight}-${visualProfile.fontStyle}-${localDeviceFonts.length}`;
  if (fontMatchCache.has(cacheKey)) {
    return fontMatchCache.get(cacheKey);
  }

  // 1. Build list of candidate fonts (local fonts + system + google + document fonts)
  const candidatePool = [];

  // Add local device fonts if available
  for (const lf of localDeviceFonts) {
    candidatePool.push({
      label: lf.fullName || lf.family,
      family: lf.family,
      postscriptName: lf.postscriptName,
      value: `"${lf.family}", sans-serif`,
      weight: lf.weight || 400,
      fontStyle: lf.fontStyle || 'normal',
      source: 'local',
      getBlob: lf.getBlob
    });
  }

  // Add built-in document & web fonts
  for (const font of ALL_FONTS) {
    const familyName = font.label.split(' ')[0];
    candidatePool.push({
      label: font.label,
      family: familyName,
      value: font.value,
      weight: 400,
      fontStyle: 'normal',
      source: 'bundled'
    });
    // Add bold variant for candidate matching
    candidatePool.push({
      label: `${font.label} Bold`,
      family: familyName,
      value: font.value,
      weight: 700,
      fontStyle: 'normal',
      source: 'bundled'
    });
  }

  // 2. Score Candidates against Visual Profile & Text Geometry
  const sampleText = element.text || 'Sample Text';
  const targetW = Math.max(10, element.width);
  const targetH = Math.max(10, element.height);
  const targetWeight = visualProfile.fontWeight || 400;
  const targetStyle = visualProfile.fontStyle || 'normal';
  const targetStretch = visualProfile.fontStretch || 'normal';

  const scoredCandidates = [];
  const measureCanvas = document.createElement('canvas');
  const mCtx = measureCanvas.getContext('2d');

  for (const candidate of candidatePool) {
    const candidateFontSize = visualProfile.fontSize || 14;
    mCtx.font = `${candidate.fontStyle} ${candidate.weight} ${candidateFontSize}px ${candidate.value}`;
    const metrics = mCtx.measureText(sampleText);
    const measuredW = metrics.width || 1;

    // Score components:
    // A. Geometry width similarity (0 to 40 pts)
    const widthDiffRatio = Math.abs(measuredW - targetW) / Math.max(targetW, measuredW);
    const geometryScore = Math.max(0, 40 * (1 - widthDiffRatio * 1.8));

    // B. Font Weight match score (0 to 30 pts)
    const weightDiff = Math.abs((candidate.weight || 400) - targetWeight);
    const strokeScore = Math.max(0, 30 * (1 - weightDiff / 800));

    // C. Font Style / Slant match score (0 to 15 pts)
    const slantScore = (candidate.fontStyle === targetStyle) ? 15 : 0;

    // D. Font Stretch match score (0 to 15 pts)
    let stretchScore = 10;
    if (targetStretch === 'condensed' && candidate.label.toLowerCase().includes('condensed')) {
      stretchScore = 15;
    } else if (targetStretch === 'condensed' && !candidate.label.toLowerCase().includes('condensed')) {
      stretchScore = 3;
    }

    const totalScore = Math.round(geometryScore + strokeScore + slantScore + stretchScore);
    const confidence = parseFloat((totalScore / 100).toFixed(2));

    scoredCandidates.push({
      candidate,
      score: totalScore,
      confidence
    });
  }

  // Sort candidates by score descending
  scoredCandidates.sort((a, b) => b.score - a.score);
  const bestMatch = scoredCandidates[0] || { candidate: candidatePool[0], score: 50, confidence: 0.5 };
  const winner = bestMatch.candidate;

  // 3. Stage 7: Exact Font Face Loading via FontFace API
  if (winner.source === 'local' && winner.getBlob && typeof window !== 'undefined' && 'FontFace' in window) {
    try {
      const fontKey = `local-${winner.family}-${winner.weight}-${winner.fontStyle}`;
      if (!loadedFontFaces.has(fontKey)) {
        const blob = await winner.getBlob();
        if (blob) {
          const fontArrayBuffer = await blob.arrayBuffer();
          const fontFace = new FontFace(winner.family, fontArrayBuffer, {
            weight: `${winner.weight}`,
            style: winner.fontStyle
          });
          document.fonts.add(fontFace);
          await fontFace.load();
          loadedFontFaces.add(fontKey);
        }
      }
    } catch (err) {
      console.warn('FontFace loading notice:', err);
    }
  }

  // Wait for document fonts if browser supports it
  if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch (e) {}
  }

  const result = {
    fontFamily: winner.value,
    fontWeight: visualProfile.fontWeight || winner.weight || 400,
    fontStyle: visualProfile.fontStyle || winner.fontStyle || 'normal',
    fontStretch: visualProfile.fontStretch || 'normal',
    color: visualProfile.textColor || element.color || '#000000',
    bgColor: visualProfile.bgColor || element.bgColor || '#ffffff',
    confidence: bestMatch.confidence,
    matchedCandidateName: winner.label,
    topCandidates: scoredCandidates.slice(0, 4)
  };

  fontMatchCache.set(cacheKey, result);
  return result;
}
