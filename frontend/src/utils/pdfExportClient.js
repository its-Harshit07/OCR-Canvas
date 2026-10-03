import { jsPDF } from 'jspdf';

/**
 * Generate PDF client-side using canonical source coordinates.
 * Matches exact visual result of editor canvas and PNG exporter.
 */
export async function generateClientSidePDF(docModel) {
  if (!docModel || !docModel.pages || docModel.pages.length === 0) {
    throw new Error('No pages found in document to export.');
  }

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: [docModel.pages[0].width || 595, docModel.pages[0].height || 842],
  });

  for (let pageIdx = 0; pageIdx < docModel.pages.length; pageIdx++) {
    const page = docModel.pages[pageIdx];
    const width = page.width || 595;
    const height = page.height || 842;

    if (pageIdx > 0) {
      pdf.addPage([width, height], width > height ? 'landscape' : 'portrait');
    }

    // Render page to offscreen canvas at native scale
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    const isJpeg = page.backgroundImage?.startsWith('data:image/jpeg') || 
                   page.mimeType === 'image/jpeg' || 
                   docModel.mimeType === 'image/jpeg' || 
                   docModel.mimeType === 'application/pdf' || 
                   /\.(jpe?g|pdf)$/i.test(docModel.name || '');

    // Fill white background for canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    if (page.backgroundImage) {
      await new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          ctx.drawImage(img, 0, 0, width, height);
          resolve();
        };
        img.onerror = () => {
          resolve();
        };
        img.src = page.backgroundImage;
      });
    }

    // Draw elements
    page.elements?.forEach((el) => {
      if (el.type !== 'text') return;

      const origX = el.originalX !== undefined ? el.originalX : el.x;
      const origY = el.originalY !== undefined ? el.originalY : el.y;
      const origW = el.originalWidth !== undefined ? el.originalWidth : el.width;
      const origH = el.originalHeight !== undefined ? el.originalHeight : el.height;

      const isMoved = Math.abs(el.x - origX) > 1 || Math.abs(el.y - origY) > 1;
      const isContentChanged = el.text !== el.originalText;
      const isDeleted = Boolean(el.isDeleted);
      const isEdited = el.isEdited || el.isNew || el.isUserCreated || isMoved || isContentChanged || isDeleted;

      const bgColor = el.bgColor || '#ffffff';

      // 1. Erase background at original location for edited or deleted text
      if (isEdited && !el.isNew) {
        ctx.fillStyle = bgColor;
        ctx.fillRect(origX, origY, origW, origH);
      }

      // 2. Draw replacement or newly added text
      if (isEdited && el.text && !isDeleted) {
        const fontSize = el.fontSize || Math.max(10, origH * 0.85);
        const fontFamily = el.fontFamily || 'Inter, Arial, sans-serif';
        const normalizedFontWeight = typeof el.fontWeight === 'number'
          ? el.fontWeight
          : (el.fontWeight === 'bold' || el.fontWeight === '700' ? 700 : 400);
        const fontStyle = el.fontStyle || 'normal';

        ctx.font = `${fontStyle} ${normalizedFontWeight} ${fontSize}px ${fontFamily}`;
        ctx.fillStyle = el.color || '#000000';
        ctx.textBaseline = 'alphabetic';

        const textX = el.x + 2;
        const textY = el.y + (el.height || origH || 14) * 0.85;

        ctx.fillText(el.text, textX, textY);
      }
    });

    if (isJpeg) {
      const pageImgData = canvas.toDataURL('image/jpeg', 0.95);
      pdf.addImage(pageImgData, 'JPEG', 0, 0, width, height, undefined, 'FAST');
    } else {
      const pageImgData = canvas.toDataURL('image/png');
      pdf.addImage(pageImgData, 'PNG', 0, 0, width, height, undefined, 'FAST');
    }
  }

  const docName = docModel.name || 'document';
  const cleanName = docName.replace(/\.[^/.]+$/, '');
  pdf.save(`${cleanName}_edited.pdf`);
}
