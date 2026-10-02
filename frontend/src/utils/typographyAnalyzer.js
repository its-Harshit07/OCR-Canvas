// Stage 1: Original Text Visual Analysis Engine

export function analyzeElementTypographyFromImage(imgElement, element) {
  if (!imgElement || !element) {
    return getDefaultTypographyProfile(element);
  }

  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    const cropX = Math.max(0, Math.floor(element.x));
    const cropY = Math.max(0, Math.floor(element.y));
    const cropW = Math.max(4, Math.ceil(element.width));
    const cropH = Math.max(4, Math.ceil(element.height));

    canvas.width = cropW;
    canvas.height = cropH;

    // Draw original image crop at native resolution
    ctx.drawImage(imgElement, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
    const imageData = ctx.getImageData(0, 0, cropW, cropH);
    const pixels = imageData.data;

    // 1. Estimate background color from outer border ring
    const borderRgb = [];
    for (let x = 0; x < cropW; x++) {
      borderRgb.push(getPixelRgb(pixels, x, 0, cropW));
      borderRgb.push(getPixelRgb(pixels, x, cropH - 1, cropW));
    }
    for (let y = 0; y < cropH; y++) {
      borderRgb.push(getPixelRgb(pixels, 0, y, cropW));
      borderRgb.push(getPixelRgb(pixels, cropW - 1, y, cropW));
    }

    const bgRgb = medianRgb(borderRgb);
    const bgHex = rgbToHex(bgRgb);

    // 2. Identify text foreground pixels using color distance from background
    const textPixels = [];
    const pixelDistances = [];
    let textPixelCount = 0;
    const totalPixels = cropW * cropH;

    for (let i = 0; i < totalPixels; i++) {
      const idx = i * 4;
      const r = pixels[idx];
      const g = pixels[idx + 1];
      const b = pixels[idx + 2];

      const dist = Math.sqrt(
        Math.pow(r - bgRgb[0], 2) +
        Math.pow(g - bgRgb[1], 2) +
        Math.pow(b - bgRgb[2], 2)
      );
      pixelDistances.push(dist);

      if (dist > 35) { // Significant contrast distance
        textPixels.push([r, g, b]);
        textPixelCount++;
      }
    }

    // Determine foreground text color
    let textRgb = [0, 0, 0];
    if (textPixels.length > 0) {
      textRgb = medianRgb(textPixels);
    } else {
      // Fallback: darkest pixels
      textRgb = [30, 30, 30];
    }
    const textColorHex = rgbToHex(textRgb);

    // 3. Pixel Density & Stroke Thickness Estimation
    const pixelDensity = textPixelCount / Math.max(1, totalPixels);
    
    // Estimate stroke thickness by analyzing horizontal runs of text pixels
    let totalStrokeLength = 0;
    let strokeCount = 0;
    for (let y = 0; y < cropH; y++) {
      let currentRun = 0;
      for (let x = 0; x < cropW; x++) {
        const i = y * cropW + x;
        if (pixelDistances[i] > 35) {
          currentRun++;
        } else {
          if (currentRun > 0 && currentRun < cropW * 0.8) {
            totalStrokeLength += currentRun;
            strokeCount++;
          }
          currentRun = 0;
        }
      }
    }

    const avgStrokeThickness = strokeCount > 0 ? (totalStrokeLength / strokeCount) : 2.5;

    // 4. Boldness & Font Weight Score
    // Ratio of stroke thickness to box height
    const strokeRatio = avgStrokeThickness / Math.max(8, cropH);
    let estimatedWeight = 400;

    if (strokeRatio > 0.28 || pixelDensity > 0.45) {
      estimatedWeight = 900; // Black / Ultra Bold
    } else if (strokeRatio > 0.23 || pixelDensity > 0.38) {
      estimatedWeight = 700; // Bold
    } else if (strokeRatio > 0.18 || pixelDensity > 0.32) {
      estimatedWeight = 600; // SemiBold
    } else if (strokeRatio > 0.14 || pixelDensity > 0.26) {
      estimatedWeight = 500; // Medium
    } else if (strokeRatio < 0.08 && pixelDensity < 0.18) {
      estimatedWeight = 300; // Light
    }

    const isBold = estimatedWeight >= 600;

    // 5. Slant & Italic Detection (Vertical shear analysis)
    let topCenterSum = 0, topCount = 0;
    let botCenterSum = 0, botCount = 0;
    const topZone = Math.floor(cropH * 0.3);
    const botZone = Math.floor(cropH * 0.7);

    for (let y = 0; y < topZone; y++) {
      for (let x = 0; x < cropW; x++) {
        if (pixelDistances[y * cropW + x] > 35) {
          topCenterSum += x;
          topCount++;
        }
      }
    }
    for (let y = botZone; y < cropH; y++) {
      for (let x = 0; x < cropW; x++) {
        if (pixelDistances[y * cropW + x] > 35) {
          botCenterSum += x;
          botCount++;
        }
      }
    }

    let isItalic = false;
    if (topCount > 0 && botCount > 0) {
      const topX = topCenterSum / topCount;
      const botX = botCenterSum / botCount;
      const shift = topX - botX; // Positive shift indicates rightward italic slant
      // Require unambiguous rightward slant (> 14 degree angle, shift/cropH > 0.25)
      if (shift > 4.5 && (shift / Math.max(1, cropH)) > 0.25) {
        isItalic = true;
      }
    }

    // 6. Font Stretch & Width Proportions (Condensed vs Expanded)
    const textLength = (element.text || '').length || 1;
    const avgCharWidth = cropW / textLength;
    const charWidthToHeightRatio = avgCharWidth / Math.max(1, cropH);

    let fontStretch = 'normal'; // 'condensed', 'normal', 'expanded'
    if (charWidthToHeightRatio < 0.42) {
      fontStretch = 'condensed';
    } else if (charWidthToHeightRatio > 0.75) {
      fontStretch = 'expanded';
    }

    return {
      textColor: textColorHex,
      bgColor: bgHex,
      contrastRatio: Math.round(Math.max(...pixelDistances)),
      pixelDensity: parseFloat(pixelDensity.toFixed(3)),
      strokeThickness: parseFloat(avgStrokeThickness.toFixed(2)),
      fontWeight: estimatedWeight,
      fontStyle: isItalic ? 'italic' : 'normal',
      fontStretch,
      fontSize: element.fontSize || Math.max(10, Math.round(cropH * 0.85)),
      avgCharWidth: parseFloat(avgCharWidth.toFixed(2)),
      analysisConfidence: textPixelCount > 10 ? 0.92 : 0.60
    };
  } catch (err) {
    console.warn('Visual typography analysis notice:', err);
    return getDefaultTypographyProfile(element);
  }
}

function getDefaultTypographyProfile(element) {
  return {
    textColor: element?.color || '#000000',
    bgColor: element?.bgColor || '#ffffff',
    contrastRatio: 255,
    pixelDensity: 0.25,
    strokeThickness: 2.0,
    fontWeight: element?.fontWeight === 'bold' ? 700 : 400,
    fontStyle: element?.fontStyle || 'normal',
    fontStretch: 'normal',
    fontSize: element?.fontSize || 14,
    avgCharWidth: 8.0,
    analysisConfidence: 0.5
  };
}

function getPixelRgb(pixels, x, y, width) {
  const i = (y * width + x) * 4;
  return [pixels[i], pixels[i + 1], pixels[i + 2]];
}

function medianRgb(rgbArray) {
  if (!rgbArray || rgbArray.length === 0) return [255, 255, 255];
  const rSorted = [...rgbArray].map(p => p[0]).sort((a, b) => a - b);
  const gSorted = [...rgbArray].map(p => p[1]).sort((a, b) => a - b);
  const bSorted = [...rgbArray].map(p => p[2]).sort((a, b) => a - b);
  const mid = Math.floor(rgbArray.length / 2);
  return [rSorted[mid], gSorted[mid], bSorted[mid]];
}

function rgbToHex(rgb) {
  return `#${((1 << 24) + (rgb[0] << 16) + (rgb[1] << 8) + rgb[2]).toString(16).slice(1)}`;
}
