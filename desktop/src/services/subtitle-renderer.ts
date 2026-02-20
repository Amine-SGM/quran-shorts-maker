// Subtitle renderer using skia-canvas
// Generates PNG images with Arabic text for video overlay

import { Canvas } from 'skia-canvas';
import * as fs from 'fs';
import * as path from 'path';
import { SubtitleConfig, Ayah } from '../types';

interface SubtitleRenderOptions {
  ayah: Ayah;
  config: SubtitleConfig;
  outputDir: string;
  width: number;
  height: number;
}

/**
 * Wrap text into lines that fit within maxWidth.
 * Splits on spaces (works for both Arabic and English).
 * Returns an array of lines.
 */
function wrapText(
  ctx: CanvasRenderingContext2D | any,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(/\s+/);
  if (words.length === 0) return [''];

  const lines: string[] = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const testLine = currentLine + ' ' + words[i];
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth) {
      lines.push(currentLine);
      currentLine = words[i];
    } else {
      currentLine = testLine;
    }
  }
  lines.push(currentLine);
  return lines;
}

/**
 * Render a single Ayah as a PNG image with Arabic text (and optional English translation)
 * Uses skia-canvas for cross-platform compatibility without GTK dependencies.
 * Long text is automatically word-wrapped to fit within the video frame.
 */
export async function renderSubtitle(options: SubtitleRenderOptions): Promise<string> {
  const { ayah, config, outputDir, width, height } = options;

  // Create canvas with video dimensions
  const canvas = new Canvas(width, height);
  const ctx = canvas.getContext('2d');

  // Clear with transparency
  ctx.clearRect(0, 0, width, height);

  // Configure font sizes
  const fontSize = config.fontSize;
  const translationFontSize = config.translationFontSize;
  const maxTextWidth = width * 0.85; // 85% of canvas width for padding
  const arabicLineHeight = fontSize * 1.4;
  const translationLineHeight = translationFontSize * 1.4;

  // Set up text rendering
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // --- Measure total block height to center it properly ---
  // Arabic lines
  ctx.font = `${fontSize}px "Noto Sans Arabic", "Arial", sans-serif`;
  const arabicLines = wrapText(ctx, ayah.arabicText, maxTextWidth);
  let totalBlockHeight = arabicLines.length * arabicLineHeight;

  // Translation lines
  let translationLines: string[] = [];
  if (config.showTranslation && ayah.englishTranslation) {
    ctx.font = `${translationFontSize}px "Arial", sans-serif`;
    translationLines = wrapText(ctx, ayah.englishTranslation, maxTextWidth);
    totalBlockHeight += fontSize * 0.8; // gap between Arabic and translation
    totalBlockHeight += translationLines.length * translationLineHeight;
  }

  // Calculate starting Y so the entire text block is centered at the target position
  let targetCenter: number;
  switch (config.position) {
    case 'top':
      targetCenter = height * 0.15;
      break;
    case 'bottom':
      targetCenter = height * 0.80;
      break;
    case 'middle':
    default:
      targetCenter = height * 0.5;
      break;
  }

  let y = targetCenter - totalBlockHeight / 2 + arabicLineHeight / 2;

  // --- Draw Arabic text (wrapped) ---
  ctx.font = `${fontSize}px "Noto Sans Arabic", "Arial", sans-serif`;
  ctx.fillStyle = getColorValue(config.color);

  const needsOutline = config.color === 'white' || config.color === 'yellow';
  if (needsOutline) {
    ctx.strokeStyle = 'black';
    ctx.lineWidth = fontSize / 15;
  }

  for (const line of arabicLines) {
    if (needsOutline) {
      ctx.strokeText(line, width / 2, y);
    }
    ctx.fillText(line, width / 2, y);
    y += arabicLineHeight;
  }

  // --- Draw English translation (wrapped) if enabled ---
  if (config.showTranslation && ayah.englishTranslation && translationLines.length > 0) {
    y += fontSize * 0.8 - arabicLineHeight; // gap (undo last line-height increment, add gap)
    y += translationLineHeight / 2; // center first translation line

    ctx.font = `${translationFontSize}px "Arial", sans-serif`;

    if (needsOutline) {
      ctx.lineWidth = translationFontSize / 15;
    }

    for (const line of translationLines) {
      if (needsOutline) {
        ctx.strokeText(line, width / 2, y);
      }
      ctx.fillText(line, width / 2, y);
      y += translationLineHeight;
    }
  }

  // Save to file
  const filename = `subtitle_${ayah.surahNumber}_${ayah.number}.png`;
  const outputPath = path.join(outputDir, filename);

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Save as PNG
  const buffer = await canvas.toBuffer('png');
  fs.writeFileSync(outputPath, buffer);

  return outputPath;
}

/**
 * Convert color name to CSS color value
 */
function getColorValue(color: string): string {
  switch (color) {
    case 'white':
      return '#FFFFFF';
    case 'yellow':
      return '#FFD700';
    case 'black_outline':
      return '#000000';
    default:
      return '#FFFFFF';
  }
}

/**
 * Render multiple Ayahs as subtitle PNGs
 */
export async function renderSubtitles(
  ayahs: Ayah[],
  config: SubtitleConfig,
  outputDir: string,
  width: number,
  height: number
): Promise<string[]> {
  const paths: string[] = [];

  for (const ayah of ayahs) {
    const path = await renderSubtitle({
      ayah,
      config,
      outputDir,
      width,
      height,
    });
    paths.push(path);
  }

  return paths;
}
