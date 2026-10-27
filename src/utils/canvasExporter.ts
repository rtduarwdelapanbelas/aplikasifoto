import { FrameState } from '../types/editor';

/**
 * Renders the frame state to a high-resolution canvas with exact ISO A5 print proportions (148mm x 210mm)
 * Standard A5 at high-res: 1240 x 1754 px (216 DPI) or scaled with targetDpi.
 */
export async function exportFrameToImage(
  frameState: FrameState,
  targetDpi: number = 1.5
): Promise<string> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context tidak tersedia');

  // Load the image first
  const img = new Image();
  img.crossOrigin = 'anonymous';

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Gagal memuat gambar untuk diunduh'));
    img.src = frameState.imageSrc;
  });

  // ISO A5 Print dimensions: 148mm x 210mm -> 1240px x 1754px
  const baseWidth = 1240;
  const baseHeight = 1754;

  const width = Math.round(baseWidth * targetDpi);
  const height = Math.round(baseHeight * targetDpi);

  canvas.width = width;
  canvas.height = height;

  // Scale context to target DPI
  ctx.scale(targetDpi, targetDpi);

  // Background
  ctx.fillStyle = frameState.bgColor || '#FAF8F5';
  ctx.fillRect(0, 0, baseWidth, baseHeight);

  // Template specific drawing
  if (frameState.template === 'film_strip') {
    renderFilmStrip(ctx, img, frameState, baseWidth, baseHeight);
  } else if (frameState.template === 'journal_kraft') {
    renderJournalKraft(ctx, img, frameState, baseWidth, baseHeight);
  } else if (frameState.template === 'minimalist_white') {
    renderMinimalistWhite(ctx, img, frameState, baseWidth, baseHeight);
  } else if (frameState.template === 'polaroid_classic') {
    renderPolaroidClassic(ctx, img, frameState, baseWidth, baseHeight);
  } else {
    // Custom Uploaded Template by Admin
    await renderCustomTemplate(ctx, img, frameState, baseWidth, baseHeight);
  }

  // Small clean footer metadata on A5 print sheet
  ctx.font = '14px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.textAlign = 'right';
  ctx.fillText('Qurtubi PhotoKlip • Format Cetak A5 (148 x 210 mm)', baseWidth - 40, baseHeight - 30);

  const dataUrl = canvas.toDataURL('image/png', 0.95);
  return dataUrl;
}

async function renderCustomTemplate(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  state: FrameState,
  w: number,
  h: number
) {
  const marginX = Math.round(w * 0.08);
  const marginTop = Math.round(h * 0.065);
  const photoW = w - marginX * 2;
  const photoH = Math.round(photoW * 1.05);

  // Photo background
  ctx.fillStyle = '#0a0a0c';
  ctx.fillRect(marginX, marginTop, photoW, photoH);

  // Draw image cropped
  drawImageCropped(ctx, img, marginX, marginTop, photoW, photoH, state);

  // If custom template has custom frame border/overlay image
  if (state.customTemplateData?.frameImage) {
    try {
      const frameImg = new Image();
      frameImg.crossOrigin = 'anonymous';
      await new Promise<void>((resolve) => {
        frameImg.onload = () => resolve();
        frameImg.onerror = () => resolve();
        frameImg.src = state.customTemplateData!.frameImage!;
      });
      ctx.drawImage(frameImg, 0, 0, w, h);
    } catch (e) {
      console.warn('Gagal memuat gambar frame template:', e);
    }
  } else {
    // Elegant frame border line if no image overlay
    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.lineWidth = 2;
    ctx.strokeRect(marginX - 2, marginTop - 2, photoW + 4, photoH + 4);
  }

  // Bottom caption area
  const captionY = marginTop + photoH + 85;
  drawCaption(ctx, state, w / 2, captionY, w - 160, w / 440);
}

function renderPolaroidClassic(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  state: FrameState,
  w: number,
  h: number
) {
  const marginX = Math.round(w * 0.08); // ~100px
  const marginTop = Math.round(h * 0.06); // ~105px
  const photoW = w - marginX * 2;
  const photoH = Math.round(photoW * 1.02); // ~1060px

  // Photo background / shadow
  ctx.fillStyle = '#0a0a0c';
  ctx.fillRect(marginX, marginTop, photoW, photoH);

  // Draw image cropped
  drawImageCropped(ctx, img, marginX, marginTop, photoW, photoH, state);

  // Accent: tape or pin
  drawAccents(ctx, state.accent, marginX, marginTop, photoW);

  // Bottom caption area
  const captionY = marginTop + photoH + 80;
  drawCaption(ctx, state, w / 2, captionY, w - 180, w / 440);

  // Date stamp bottom right if enabled
  if (state.showDate && state.dateText) {
    ctx.font = '22px "Courier Prime", monospace';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.textAlign = 'right';
    ctx.fillText(state.dateText, w - marginX - 20, h - 70);
  }
}

function renderMinimalistWhite(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  state: FrameState,
  w: number,
  h: number
) {
  const marginX = Math.round(w * 0.1);
  const marginTop = Math.round(h * 0.08);
  const photoW = w - marginX * 2;
  const photoH = Math.round(photoW * 1.15);

  // Subtle border hairline
  ctx.strokeStyle = 'rgba(0,0,0,0.12)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(marginX - 1, marginTop - 1, photoW + 2, photoH + 2);

  // Draw image
  drawImageCropped(ctx, img, marginX, marginTop, photoW, photoH, state);

  // Minimalist Caption
  const captionY = marginTop + photoH + 90;
  drawCaption(ctx, state, w / 2, captionY, w - 240, w / 440);

  // Subtitle / location
  if (state.subCaption) {
    ctx.font = '20px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.textAlign = state.textAlign;
    const subX = state.textAlign === 'center' ? w / 2 : state.textAlign === 'left' ? marginX : w - marginX;
    ctx.fillText(state.subCaption, subX, captionY + 70);
  }
}

function renderFilmStrip(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  state: FrameState,
  w: number,
  h: number
) {
  const sprocketH = 46;
  const sprocketW = 28;
  const sprocketCount = 14;
  const step = w / sprocketCount;

  // Top sprockets
  ctx.fillStyle = '#08080a';
  for (let i = 0; i < sprocketCount; i++) {
    const sx = i * step + 28;
    drawRoundedRect(ctx, sx, 32, sprocketW, sprocketH, 6);
    ctx.fill();
  }

  // Bottom sprockets
  for (let i = 0; i < sprocketCount; i++) {
    const sx = i * step + 28;
    drawRoundedRect(ctx, sx, h - 80, sprocketW, sprocketH, 6);
    ctx.fill();
  }

  // Film code header
  ctx.fillStyle = '#E88B2A';
  ctx.font = 'bold 22px "Courier Prime", monospace';
  ctx.textAlign = 'left';
  ctx.fillText('FUJIFILM 400', 60, 115);
  ctx.textAlign = 'right';
  ctx.fillText('▶ 24A  •  ISO 400', w - 60, 115);

  // Main photo
  const photoMarginX = 60;
  const photoMarginY = 140;
  const photoW = w - photoMarginX * 2;
  const photoH = Math.round(photoW * 0.95);

  drawImageCropped(ctx, img, photoMarginX, photoMarginY, photoW, photoH, state);

  // Film bottom markings
  ctx.fillStyle = '#F5ECE3';
  const captionY = photoMarginY + photoH + 85;
  drawCaption(ctx, state, w / 2, captionY, w - 160, w / 440);

  // Retro orange LED date stamp on photo if enabled
  if (state.showDate && state.dateText) {
    ctx.font = 'bold 26px "Courier Prime", monospace';
    ctx.fillStyle = '#FF5E00';
    ctx.shadowColor = 'rgba(255, 94, 0, 0.7)';
    ctx.shadowBlur = 6;
    ctx.textAlign = 'right';
    ctx.fillText(state.dateText, photoMarginX + photoW - 35, photoMarginY + photoH - 35);
    ctx.shadowBlur = 0;
  }
}

function renderJournalKraft(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  state: FrameState,
  w: number,
  h: number
) {
  // Kraft texture dots simulation
  ctx.fillStyle = 'rgba(100, 70, 40, 0.05)';
  for (let i = 0; i < w; i += 18) {
    for (let j = 0; j < h; j += 18) {
      if ((i + j) % 36 === 0) {
        ctx.fillRect(i, j, 2, 2);
      }
    }
  }

  const photoMarginX = Math.round(w * 0.1);
  const photoMarginY = Math.round(h * 0.08);
  const photoW = w - photoMarginX * 2;
  const photoH = Math.round(photoW * 1.05);

  // Photo white mat border
  ctx.fillStyle = '#FFFFFF';
  ctx.shadowColor = 'rgba(0,0,0,0.14)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 6;
  ctx.fillRect(photoMarginX - 18, photoMarginY - 18, photoW + 36, photoH + 36);
  ctx.shadowColor = 'transparent';

  drawImageCropped(ctx, img, photoMarginX, photoMarginY, photoW, photoH, state);

  // Washi tape accent on top
  ctx.fillStyle = 'rgba(230, 200, 160, 0.9)';
  ctx.save();
  ctx.translate(w / 2 - 80, photoMarginY - 36);
  ctx.rotate(-0.03);
  ctx.fillRect(0, 0, 160, 36);
  ctx.restore();

  // Caption handwritten
  const captionY = photoMarginY + photoH + 110;
  drawCaption(ctx, state, w / 2, captionY, w - 200, w / 440);

  // Vintage postal stamp
  if (state.showDate) {
    ctx.save();
    ctx.translate(w - photoMarginX - 60, captionY + 80);
    ctx.rotate(0.08);
    ctx.strokeStyle = 'rgba(120, 60, 40, 0.45)';
    ctx.lineWidth = 2;
    ctx.strokeRect(-60, -22, 120, 44);
    ctx.font = '16px "Courier Prime", monospace';
    ctx.fillStyle = 'rgba(120, 60, 40, 0.65)';
    ctx.textAlign = 'center';
    ctx.fillText('MEMORABILIA', 0, 6);
    ctx.restore();
  }
}

function drawImageCropped(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  state: FrameState
) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  // Apply filters
  if (state.filter === 'warm_vintage') {
    ctx.filter = 'sepia(0.2) contrast(1.05) brightness(1.02)';
  } else if (state.filter === 'noir') {
    ctx.filter = 'grayscale(1) contrast(1.2) brightness(0.95)';
  } else if (state.filter === 'golden_hour') {
    ctx.filter = 'sepia(0.25) saturate(1.3) brightness(1.05)';
  } else if (state.filter === 'film_fade') {
    ctx.filter = 'contrast(0.9) brightness(1.05) saturate(0.85)';
  } else if (state.filter === 'vivid') {
    ctx.filter = 'contrast(1.12) saturate(1.35)';
  }

  // Calculate cover dimensions
  const imgRatio = img.width / img.height;
  const frameRatio = w / h;
  let renderW = w;
  let renderH = h;

  if (imgRatio > frameRatio) {
    renderH = h * state.zoom;
    renderW = renderH * imgRatio;
  } else {
    renderW = w * state.zoom;
    renderH = renderW / imgRatio;
  }

  const offsetX = x + (w - renderW) / 2 + state.panX * (w / 440);
  const offsetY = y + (h - renderH) / 2 + state.panY * (h / 620);

  ctx.drawImage(img, offsetX, offsetY, renderW, renderH);
  ctx.restore();
}

function drawCaption(
  ctx: CanvasRenderingContext2D,
  state: FrameState,
  centerX: number,
  y: number,
  maxWidth: number,
  scale: number = 1
) {
  let fontName = 'Caveat';
  if (state.font === 'kalam') fontName = 'Kalam';
  else if (state.font === 'typewriter') fontName = 'Special Elite';
  else if (state.font === 'courier') fontName = 'Courier Prime';
  else if (state.font === 'playfair') fontName = 'Playfair Display';
  else if (state.font === 'cormorant') fontName = 'Cormorant Garamond';
  else if (state.font === 'sans') fontName = 'Plus Jakarta Sans';
  else if (state.font === 'pacifico') fontName = 'Pacifico';
  else if (state.font === 'dancing') fontName = 'Dancing Script';
  else if (state.font === 'cinzel') fontName = 'Cinzel';
  else if (state.font === 'merriweather') fontName = 'Merriweather';
  else if (state.font === 'montserrat') fontName = 'Montserrat';

  const isBold = state.fontStyle === 'bold' || state.fontStyle === 'bold_italic';
  const isItalic = state.fontStyle === 'italic' || state.fontStyle === 'bold_italic';
  const titleStylePrefix = `${isItalic ? 'italic ' : ''}bold `;
  const captionStylePrefix = `${isItalic ? 'italic ' : ''}${isBold ? 'bold ' : ''}`;

  let startX = centerX;
  if (state.textAlign === 'left') startX = centerX - maxWidth / 2;
  if (state.textAlign === 'right') startX = centerX + maxWidth / 2;

  ctx.textAlign = state.textAlign || 'center';
  let curY = y;

  const baseFontSize = (state.fontSize || 22) * scale;

  // Draw Title if present
  if (state.title && state.title.trim()) {
    ctx.font = `${titleStylePrefix}${Math.round(baseFontSize * 1.25)}px "${fontName}", sans-serif`;
    ctx.fillStyle = state.textColor || '#222222';
    wrapText(ctx, state.title, startX, curY, maxWidth, baseFontSize * 1.35);
    curY += baseFontSize * 1.5;
  }

  // Draw Description / Caption
  if (state.caption && state.caption.trim()) {
    ctx.font = `${captionStylePrefix}${Math.round(baseFontSize * 1.05)}px "${fontName}", sans-serif`;
    ctx.fillStyle = state.textColor || '#333333';
    wrapText(ctx, state.caption, startX, curY, maxWidth, baseFontSize * 1.4);
  }
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(' ');
  let line = '';
  let curY = y;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line.trim(), x, curY);
      line = words[n] + ' ';
      curY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), x, curY);
}

function drawAccents(
  ctx: CanvasRenderingContext2D,
  accent: string,
  photoX: number,
  photoY: number,
  photoW: number
) {
  if (accent === 'tape_top') {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.strokeStyle = 'rgba(200, 200, 200, 0.4)';
    ctx.lineWidth = 1.5;
    const tapeW = 140;
    const tapeH = 42;
    ctx.fillRect(photoX + (photoW - tapeW) / 2, photoY - 21, tapeW, tapeH);
    ctx.strokeRect(photoX + (photoW - tapeW) / 2, photoY - 21, tapeW, tapeH);
  }
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
