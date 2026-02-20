// Video cache - downloads and stores stock videos from Pexels
import * as fs from 'fs';
import * as path from 'path';

export function getVideoCacheDir(): string {
  const base = process.env.LOCALAPPDATA || process.env.HOME || '.';
  return path.join(base, 'QuranShorts', 'videoCache');
}

export async function downloadVideo(url: string, videoId: string): Promise<string> {
  const cacheDir = getVideoCacheDir();
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }

  const filename = `video_${videoId}.mp4`;
  const cachedPath = path.join(cacheDir, filename);

  if (fs.existsSync(cachedPath)) {
    return cachedPath;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download video: ${response.status}`);
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(cachedPath, buffer);
    return cachedPath;
  } catch (error) {
    throw new Error(`Video download failed for ${url}: ${error instanceof Error ? error.message : String(error)}`);
  }
}
