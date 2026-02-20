// Video cache service for stock video downloads
// Similar to audio cache but for video files (larger, so TTL may be shorter?)

import { ensureDir, deleteFile, getFileStat } from './fs';
import { getCurrentTimestamp } from './time';

const DEFAULT_VIDEO_CACHE_TTL = 3 * 60 * 60; // 3 hours, same as audio

interface VideoCacheOptions {
  cacheDir: string;
  ttlSeconds?: number;
}

interface CachedVideo {
  url: string;
  filePath: string;
  cachedAt: Date;
  size: number;
}

/**
 * Utility to generate safe filename from URL.
 */
export function filenameFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const name = pathname.substring(pathname.lastIndexOf('/') + 1);
    return name || `video_${Date.now()}`;
  } catch {
    return `video_${Date.now()}`;
  }
}

/**
 * Abstract VideoCache service.
 * Platform-specific implementations should handle actual network download.
 */
export abstract class VideoCache {
  protected cacheDir: string;
  protected ttlSeconds: number;

  constructor(options: VideoCacheOptions) {
    this.cacheDir = options.cacheDir;
    this.ttlSeconds = options.ttlSeconds ?? DEFAULT_VIDEO_CACHE_TTL;
  }

  abstract initialize(): Promise<void>;
  abstract get(url: string): Promise<string | null>; // returns file path if cached and valid
  abstract downloadAndCache(url: string): Promise<string>; // returns file path
  abstract isCacheValid(filePath: string): Promise<boolean>;
  abstract cleanupStale(): Promise<number>;
  abstract clearAll(): Promise<void>;
}
