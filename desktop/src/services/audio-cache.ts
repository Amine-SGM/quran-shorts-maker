// Audio cache - downloads and stores Quran recitation MP3s
import * as fs from 'fs';
import * as path from 'path';

// Cache directory in user data folder
export function getAudioCacheDir(): string {
  // In production, use app.getPath('userData')
  const base = process.env.LOCALAPPDATA || process.env.HOME || '.';
  return path.join(base, 'QuranShorts', 'audioCache');
}

/**
 * Get audio file for ayah, downloading if not cached
 */
export async function getAudioFile(
  reciterSlug: string,
  surah: number,
  ayah: number,
  audioUrl: string // Now required - must be provided by caller
): Promise<string> {
  const cacheDir = getAudioCacheDir();
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }

  const filename = `${reciterSlug.replace(/\|/g, '_')}_${surah.toString().padStart(3, '0')}${ayah.toString().padStart(3, '0')}.mp3`;
  const cachedPath = path.join(cacheDir, filename);

  if (fs.existsSync(cachedPath)) {
    return cachedPath;
  }

  // Download using the provided URL
  try {
    const response = await fetch(audioUrl);
    if (!response.ok) {
      throw new Error(`Failed to download audio: ${response.status}`);
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(cachedPath, buffer);
    return cachedPath;
  } catch (error) {
    throw new Error(`Audio download failed for ${audioUrl}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Generate cache key for a job (to include in filename)
 */
export function generateJobCacheKey(job: any): string {
  return `${job.surahNumber}_${job.ayahRangeStart}-${job.ayahRangeEnd}_${job.reciterId}`;
}
