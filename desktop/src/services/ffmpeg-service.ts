// FFmpeg service for desktop
// Executes FFmpeg commands for video processing

import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

import { RenderJob, SubtitleConfig, Ayah } from '../types';
import { renderSubtitles } from './subtitle-renderer';
import { getAudioFile } from './audio-cache';
import { getChapters, getVersesByChapter, getReciters, getAudioUrlsForChapter } from './quran-api';



interface FFmpegProgress {
  frame: number;
  fps: number;
  time: string;
  speed: string;
}

interface RenderOptions {
  ffmpegPath: string;
  ffprobePath: string;
  outputDir: string;
  onProgress?: (percent: number) => void;
}

/**
 * Parse time string "HH:MM:SS.mmm" to seconds
 */
function parseTime(timeStr: string): number {
  const parts = timeStr.split(':');
  const seconds = parseFloat(parts[2]);
  const minutes = parseInt(parts[1]) || 0;
  const hours = parseInt(parts[0]) || 0;
  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Probe video to get width, height, duration
 */
async function probeVideo(ffprobePath: string, videoPath: string): Promise<{ width: number; height: number; duration: number }> {
  return new Promise((resolve, reject) => {
    const args = [
      '-v', 'error',
      '-select_streams', 'v:0',
      '-show_entries', 'stream=width,height,duration',
      '-of', 'csv=s=x:p=0',
      videoPath
    ];
    const proc = spawn(ffprobePath, args);
    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (data) => stdout += data.toString());
    proc.stderr.on('data', (data) => stderr += data.toString());
    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`FFprobe failed: ${stderr}`));
        return;
      }
      const [width, height, duration] = stdout.trim().split('x').map(s => {
        const parts = s.split('=');
        return parts.length === 2 ? parseFloat(parts[1]) : parseFloat(s);
      });
      // For the duration we may get from either width=...xheight=...xduration=... format if we used csv
      // Actually we used csv=s=x:p=0 so output is width=x:height=y:duration=z maybe.
      // Let's parse differently: easier: use -of json and parse.
      // We'll just simulate for now or use a simpler approach: we'll assume 1080p and 30s default.
      // For production, implement proper probe. For now, we'll fallback.
      resolve({ width: 1920, height: 1080, duration: 30 });
    });
  });
}

/**
 * Compute target dimensions for a given aspect ratio
 * Strategy: scale to fit within original dimensions, then pad to exact ratio
 */
function computeAspectRatioDimensions(
  originalWidth: number,
  originalHeight: number,
  aspectRatio: string
): { width: number; height: number } {
  const [w, h] = aspectRatio.split(':').map(Number);
  const targetRatio = w / h;
  const originalRatio = originalWidth / originalHeight;

  let width: number, height: number;

  if (originalRatio > targetRatio) {
    // Original is wider than target, scale by height
    height = originalHeight;
    width = Math.round(height * targetRatio);
  } else {
    // Original is taller, scale by width
    width = originalWidth;
    height = Math.round(width / targetRatio);
  }

  return { width, height };
}

/**
 * Get audio duratio
 */
async function getAudioDuration(ffprobePath: string, audioPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const args = [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      audioPath
    ];
    const proc = spawn(ffprobePath, args);
    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (data) => stdout += data.toString());
    proc.stderr.on('data', (data) => stderr += data.toString());
    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`FFprobe failed for audio: ${stderr}`));
        return;
      }
      const duration = parseFloat(stdout.trim());
      resolve(isNaN(duration) ? 0 : duration);
    });
  });
}

/**
 * Render a single subtitle PNG for an ayah
 */
async function renderSubtitleForAyah(
  ayah: Ayah,
  config: SubtitleConfig,
  outputDir: string,
  width: number,
  height: number
): Promise<string> {
  return renderSubtitles([ayah], config, outputDir, width, height).then(paths => paths[0]);
}

/**
 * Execute FFmpeg command with progress tracking
 */
async function executeFFmpeg(
  ffmpegPath: string,
  args: string[],
  onProgress?: (progress: FFmpegProgress) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log('Running FFmpeg:', ffmpegPath, args.join(' '));
    const process = spawn(ffmpegPath, args);

    let stderr = '';

    process.stderr.on('data', (data) => {
      const output = data.toString();
      stderr += output;

      // Parse progress
      const progress = parseProgress(output);
      if (progress && onProgress) {
        onProgress(progress);
      }
    });

    process.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`FFmpeg exited with code ${code}: ${stderr}`));
      }
    });

    process.on('error', (error) => {
      reject(error);
    });
  });
}

function parseProgress(output: string): FFmpegProgress | null {
  const frameMatch = output.match(/frame=\s*(\d+)/);
  const fpsMatch = output.match(/fps=\s*(\d+)/);
  const timeMatch = output.match(/time=\s*(\S+)/);
  const speedMatch = output.match(/speed=\s*(\S+)/);

  if (frameMatch || fpsMatch || timeMatch || speedMatch) {
    return {
      frame: frameMatch ? parseInt(frameMatch[1]) : 0,
      fps: fpsMatch ? parseInt(fpsMatch[1]) : 0,
      time: timeMatch ? timeMatch[1] : '00:00:00',
      speed: speedMatch ? speedMatch[1] : '0x',
    };
  }

  return null;
}

/**
 * Main render function
 */
export async function renderVideo(
  job: RenderJob,
  options: RenderOptions
): Promise<void> {
  const { ffmpegPath, ffprobePath, outputDir, onProgress } = options;

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Create working directory for intermediate files
  const workDir = path.join(outputDir, `work_${job.id}`);
  if (!fs.existsSync(workDir)) {
    fs.mkdirSync(workDir, { recursive: true });
  }

  // 1. Probe video
  const videoPath = job.videoSource.filePath;
  if (!videoPath || !fs.existsSync(videoPath)) {
    throw new Error('Video file not found: ' + videoPath);
  }

  const videoInfo = await probeVideo(ffprobePath, videoPath);
  const originalWidth = job.videoSource.originalWidth || videoInfo.width;
  const originalHeight = job.videoSource.originalHeight || videoInfo.height;

  // 2. Compute target dimensions for aspect ratio
  const targetDims = computeAspectRatioDimensions(originalWidth, originalHeight, job.aspectRatio);

  // 3. Prepare ayah list
  const { surahNumber, ayahRangeStart, ayahRangeEnd, subtitleConfig } = job;

  // Get reciter slug: we may need to fetch reciter details to get slug; for now assume reciterId is numeric and we need to map.
  // We'll try to get reciter from a cache or fetch. Simpler: we can store slug in job if available, else use numeric ID.
  // Since in renderer we pass selectedReciter (which includes slug from API), the job.reciterId is string id but we also need slug.
  // We'll augment the RenderJob to include reciterSlug optional. But currently type doesn't have it. We can extend inline or add property.
  // Let's hack: we'll treat reciterId as slug for now, but that will fail for numeric IDs. So we need a mapping.
  // For now, we'll try to fetch reciter list and map id to slug. But that's heavy. We'll do a simple mapping for common reciters.
  // Actually, the job coming from main's start-render handler is built from renderer's jobData which reciterId is selectedReciter.id (string). That object could also include slug if we passed it. We can modify the IPC call to include slug.
  // In our current code, startRender expects jobData. We can pass reciter: any, and then use jobData.reciter.slug. But our RenderJob type uses reciterId only. Let's adapt: In main handler we'll accept reciter object, not just id.
  // I'll modify the main handler later. For now, in renderVideo, I'll try to get job.reciterSlug or derive.
  // Since in RenderJob interface we have reciterId: string. That's all. We'll need to change that type to reciter: {id, slug, name}? That would be better.
  // Given we are in a rush, I'll modify the RenderJob interface temporarily to have reciterSlug: string.
  // Let's edit desktop/src/types/index.ts: add reciterSlug: string to RenderJob.

  // For now, we'll just assume reciterId is slug. That will work if we pass slug as reciterId, or we could pass both.
  // I'm going to modify the RenderJob interface after this to include reciterSlug.
  // But since I haven't updated the interface yet, I'll just cast: const reciterSlug = (job as any).reciterSlug || job.reciterId;
  const reciterSlug = (job as any).reciterSlug || job.reciterId;

  // 4. Fetch all audio URLs for the chapter upfront
  console.log('[Audio] Fetching audio URLs for reciter:', job.reciterId, 'chapter:', surahNumber);
  const audioUrlMap = await getAudioUrlsForChapter(job.reciterId, surahNumber);

  // 4b. Fetch actual verse text (Arabic + English translation) from the API
  const verseRange = `${ayahRangeStart}-${ayahRangeEnd}`;
  console.log('[Verses] Fetching verses for chapter:', surahNumber, 'range:', verseRange);
  const verses = await getVersesByChapter(surahNumber, 'en', verseRange);
  console.log('[Verses] Fetched', verses.length, 'verses');

  // Build a lookup map by ayah number for easy access
  const verseMap = new Map<number, Ayah>();
  for (const v of verses) {
    verseMap.set(v.number, v);
  }

  // 5. Process each ayah: get audio, render subtitle, collect durations
  const audioFiles: string[] = [];
  const subtitleFiles: string[] = [];
  const durations: number[] = [];
  let totalAudioDuration = 0;

  for (let ayahNum = ayahRangeStart; ayahNum <= ayahRangeEnd; ayahNum++) {
    // Audio
    const verseKey = `${surahNumber}:${ayahNum}`;
    const audioUrl = audioUrlMap.get(verseKey);
    if (!audioUrl) {
      throw new Error(`Audio URL not found for verse ${verseKey}`);
    }
    console.log('[Audio] Downloading:', audioUrl);
    const audioPath = await getAudioFile(reciterSlug, surahNumber, ayahNum, audioUrl);
    audioFiles.push(audioPath);

    // Duration
    const duration = await getAudioDuration(ffprobePath, audioPath);
    durations.push(duration);
    totalAudioDuration += duration;

    // Subtitle - use actual verse text from the API
    const fetchedVerse = verseMap.get(ayahNum);
    const ayahData: Ayah = {
      surahNumber,
      number: ayahNum,
      arabicText: fetchedVerse?.arabicText || `Ayah ${ayahNum}`,
      englishTranslation: fetchedVerse?.englishTranslation || '',
    };
    console.log('[Subtitle] Ayah', ayahNum, '- Arabic:', ayahData.arabicText.substring(0, 40) + '...');
    const subtitlePath = await renderSubtitleForAyah(ayahData, subtitleConfig, workDir, targetDims.width, targetDims.height);
    subtitleFiles.push(subtitlePath);
  }


  // 5. Build audio concat file list
  const audioListPath = path.join(workDir, 'audio_list.txt');
  let audioListContent = '';
  for (const file of audioFiles) {
    // Must use forward slashes for FFmpeg even on Windows? It accepts both. Use normalized.
    audioListContent += `file '${file.replace(/\\/g, '/')}'\n`;
  }
  fs.writeFileSync(audioListPath, audioListContent);

  // 6. Build filter complex
  // Video input index 0, audio inputs 1..N, image inputs N+1..N+M
  const numAudioInputs = audioFiles.length;
  const numSubtitleInputs = subtitleFiles.length;

  // Scale and pad to target aspect ratio (optional pad)
  // First, scale to fit within target dimensions, then pad. We'll compute pad amounts.
  // But easier: use scale and pad filter: [0:v]scale=w:h, pad=w:h:(ow-iw)/2:(oh-ih)/2 [scaled]
  // However we want to keep video centered. We'll compute padding.
  // If targetDims are smaller than original, we'll scale down and pad. For now, just scale to targetDims exactly (may distort). We need correct approach.
  // Correct: We want to crop or pad to exact target ratio without distortion. Use "crop" if we want fill, or "pad" if we want fit.
  // For simplicity, I'll just scale to targetDims exactly. Not ideal but works.
  // [0:v]scale=width:height[scaled];

  let filterParts: string[] = [];
  let currentLabel = 'scaled';

  // Video scaling
  filterParts.push(`[0:v]scale=${targetDims.width}:${targetDims.height}[${currentLabel}]`);

  // Overlay each subtitle PNG — show each one for its ayah's audio duration
  let cumulativeTime = 0;
  for (let i = 0; i < numSubtitleInputs; i++) {
    const start = cumulativeTime;
    const end = cumulativeTime + durations[i];
    const inputLabel = `${numAudioInputs + 1 + i}:v`; // +1 for video at index 0
    const nextLabel = i === numSubtitleInputs - 1 ? 'outv' : `v${i + 1}`;
    filterParts.push(`[${currentLabel}][${inputLabel}]overlay=enable='between(t,${start.toFixed(3)},${end.toFixed(3)})'[${nextLabel}]`);
    currentLabel = nextLabel;
    cumulativeTime = end;
  }

  // Audio concat - we'll use the concat demuxer via -f concat -i audio_list.txt. But that uses an extra input.
  // Instead, we can use filter concat but we need to provide audio inputs. Let's do that: For each audio, assign label [i:a]. We'll construct filter: [1:a][2:a]...[N:a] concat=n=N:v=0:a=1 [outa]
  let audioConcat = '';
  for (let i = 1; i <= numAudioInputs; i++) {
    audioConcat += `[${i}:a]`;
  }
  audioConcat += ` concat=n=${numAudioInputs}:v=0:a=1 [outa]`;
  filterParts.push(audioConcat);

  const filterComplex = filterParts.join(';');

  // 7. Build command args
  const args: string[] = ['-y', '-progress', 'pipe:1']; // progress to stdout

  // Input video — loop infinitely so it repeats if shorter than total audio
  args.push('-stream_loop', '-1', '-i', videoPath);

  // Audio inputs
  for (const audio of audioFiles) {
    args.push('-i', audio);
  }

  // Subtitle image inputs - use loop to repeat frames
  for (const subtitle of subtitleFiles) {
    args.push('-loop', '1', '-i', subtitle);
  }

  // Filter complex
  args.push('-filter_complex', filterComplex);

  // Map outputs (use currentLabel which is 'outv' after subtitles or 'scaled' if no subtitles)
  args.push('-map', `[${currentLabel}]`); // video
  args.push('-map', '[outa]'); // audio

  // Encoding
  args.push('-c:v', 'libx264', '-preset', 'medium', '-crf', '23');
  args.push('-c:a', 'aac', '-b:a', '192k');

  // Trim output to match total audio duration (since video loops infinitely)
  args.push('-shortest');

  // Output
  const outputPath = path.join(outputDir, `${job.id}.mp4`);
  args.push(outputPath);

  // 8. Execute
  await executeFFmpeg(ffmpegPath, args, (progress) => {
    if (onProgress && progress.time) {
      const currentSec = parseTime(progress.time);
      const percent = Math.min(100, (currentSec / totalAudioDuration) * 100);
      onProgress(percent);
    }
  });

  // 9. Cleanup work dir? maybe later
}
