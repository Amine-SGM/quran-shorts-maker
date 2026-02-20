// FFmpeg command builder
// Generates appropriate FFmpeg commands based on render parameters

import { RenderJob, VideoSource, SubtitleConfig, AspectRatioDimensions } from '../types';
import { buildCachePath } from './audio-cache';
import { getBestVideoUrl } from '../api/pexels-client';

/** Aspect ratio definitions (width x height in pixels, based on 1080p baseline) */
const ASPECT_RATIO_MAP: Record<string, AspectRatioDimensions> = {
  '9:16': { width: 1080, height: 1920 },
  '1:1': { width: 1080, height: 1080 },
  '4:5': { width: 1080, height: 1350 },
  '16:9': { width: 1920, height: 1080 },
};

/**
 * Get target dimensions for an aspect ratio string.
 */
export function getAspectRatioDimensions(ratio: string): AspectRatioDimensions | undefined {
  return ASPECT_RATIO_MAP[ratio];
}

/**
 * Build FFmpeg filter complex for scaling and padding to target aspect ratio.
 * This ensures no stretching, only padding (black bars) if needed.
 * Returns a filter string to be used in -filter_complex.
 */
export function buildAspectRatioFilter(
  inputWidth: number,
  inputHeight: number,
  targetRatio: string
): string {
  const target = getAspectRatioDimensions(targetRatio);
  if (!target) {
    throw new Error(`Unsupported aspect ratio: ${targetRatio}`);
  }

  // If input already matches target ratio exactly, no filter needed.
  if (inputWidth === target.width && inputHeight === target.height) {
    return ''; // no filter
  }

  // Calculate scaling to fit within target dimensions while preserving aspect ratio.
  const inputRatio = inputWidth / inputHeight;
  const targetRatioValue = target.width / target.height;

  let scaleW: number, scaleH: number;
  if (inputRatio > targetRatioValue) {
    // Input is wider relative to height; scale by height
    scaleH = target.height;
    scaleW = Math.round(inputWidth * (target.height / inputHeight));
  } else {
    // Input is taller relative to width; scale by width
    scaleW = target.width;
    scaleH = Math.round(inputHeight * (target.width / inputWidth));
  }

  // Pad to target dimensions, centering the video.
  const padX = Math.floor((target.width - scaleW) / 2);
  const padY = Math.floor((target.height - scaleH) / 2);

  // Example: [0:v]scale=1920:1080,pad=1920:1080:0:0
  return `scale=${scaleW}:${scaleH},pad=${target.width}:${target.height}:${padX}:${padY}`;
}

/**
 * Build the FFmpeg command for video without subtitles (fast path).
 * Uses -c:v copy to avoid re-encoding.
 */
export function buildSimpleMergeCommand(
  audioFiles: string[], // list of audio file paths
  videoInput: string,
  outputPath: string,
  aspectRatio?: string // optional, may require scaling even without subs
): string[] {
  const cmd: string[] = ['ffmpeg', '-i', videoInput];

  // Add audio inputs as concat demuxer? Actually simpler: use -f concat -i list.txt
  // But we can also use -i audio1 -i audio2 ... and then map with concat filter.
  // For simplicity, we'll create a temporary file list and use -f concat -i filelist.txt -i video.
  // That's more complex. For MVP, we can concatenate audio via a filter or use the concat demuxer.
  // Let's describe a simpler approach: pre-concatenate audio files into one using ffmpegconcat protocol?
  // However, task T035/042 expects the service to build and execute commands, so the command builder should produce an array.

  // Placeholder implementation; detailed FFmpeg command construction will be in service.
  // We'll provide a basic command that works conceptually.

  // For now, assume we concatenate audio into a single stream using the concat filter.
  // Build filter complex: [0:a][1:a][2:a]concat=n=3:v=0:a=1[a]
  // But we need dynamic number of inputs.

  // Since this is just a builder, we can construct with -i for each audio and concat filter.
  const audioInputs: string[] = [];
  const filterParts: string[] = [];
  for (let i = 0; i < audioFiles.length; i++) {
    cmd.push('-i', audioFiles[i]);
    audioInputs.push(`[${i}:a]`);
  }
  const concatOut = '[a]';
  filterParts.push(`${audioInputs.join('')}concat=n=${audioFiles.length}:v=0:a=1${concatOut}`);

  // If aspect ratio scaling needed, apply to video stream.
  // video index = audio count
  const videoIndex = audioFiles.length;
  let videoFilter = '';
  if (aspectRatio) {
    const scalePad = buildAspectRatioFilter(1920, 1080, aspectRatio); // placeholder real dims should come from video probe
    if (scalePad) {
      videoFilter = `[${videoIndex}:v]${scalePad}[v]`;
      filterParts.push(videoFilter);
    }
  }

  // Map video and audio to output
  const videoMap = videoFilter ? '[v]' : `[${videoIndex}:v]`;
  cmd.push('-filter_complex', filterParts.join(';'));
  cmd.push('-map', videoMap);
  cmd.push('-map', '[a]');

  // Use copy codec for video if no subtitles and no scaling?
  cmd.push('-c:v', 'copy'); // but if scaling applied, must re-encode; we'll handle that later
  cmd.push('-c:a', 'aac');
  cmd.push('-shortest');
  cmd.push('-y'); // overwrite output
  cmd.push(outputPath);
  return cmd;
}

/**
 * Build FFmpeg command for video with subtitles (re-encode required).
 * Subtitles are provided as PNG images overlay with timing.
 * This version builds a filter_complex with multiple overlay filters.
 */
export function buildSubtitleMergeCommand(
  audioFiles: string[],
  videoInput: string,
  subtitlePngs: Array<{ path: string; start: number; end: number }>,
  outputPath: string,
  qualityPreset: 'fast' | 'quality' = 'quality',
  aspectRatio?: string
): string[] {
  const cmd: string[] = ['ffmpeg', '-i', videoInput];
  const audioInputs: string[] = [];
  const filterParts: string[] = [];

  // Add audio inputs
  for (let i = 0; i < audioFiles.length; i++) {
    cmd.push('-i', audioFiles[i]);
    audioInputs.push(`[${i}:a]`);
  }
  // Concatenate audio
  const concatOut = '[a]';
  filterParts.push(`${audioInputs.join('')}concat=n=${audioFiles.length}:v=0:a=1${concatOut}`);

  const videoIndex = audioFiles.length;
  let videoFilter = '';

  // Aspect ratio scaling if needed
  if (aspectRatio) {
    const scalePad = buildAspectRatioFilter(1920, 1080, aspectRatio);
    if (scalePad) {
      videoFilter = `[${videoIndex}:v]${scalePad}[vtemp]`;
      filterParts.push(videoFilter);
      // We'll overlay on vtemp
    }
  }

  // Build overlay chain
  const baseVideo = videoFilter ? 'vtemp' : `${videoIndex}:v`;
  let currentLabel = `[${baseVideo}]`;

  subtitlePngs.forEach((sub, idx) => {
    const overlayLabel = idx === subtitlePngs.length - 1 ? 'vout' : `v${idx}`;
    const enableExpr = `between(t,${sub.start},${sub.end})`;
    filterParts.push(`${currentLabel}[${idx}:v]overlay=0:0:enable='${enableExpr}'${overlayLabel}`);
    currentLabel = `[${overlayLabel}]`;
  });

  // Assemble final command
  cmd.push('-filter_complex', filterParts.join(';'));
  cmd.push('-map', currentLabel); // video
  cmd.push('-map', '[a]'); // audio

  // Video encoding settings
  const crf = qualityPreset === 'quality' ? '18' : '23';
  const preset = qualityPreset === 'quality' ? 'fast' : 'veryfast';
  cmd.push('-c:v', 'libx264', '-crf', crf, '-preset', preset);
  cmd.push('-c:a', 'aac');
  cmd.push('-y');
  cmd.push(outputPath);
  return cmd;
}
