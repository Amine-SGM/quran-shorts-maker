// Audio cache service with TTL enforcement
// Stores downloaded audio files in platform-specific cache directories
// Shared interface; platform-specific implementations may extend

import { CacheEntry } from '../types';
import { ensureDir, getFileStat, deleteFile } from './fs';
import { getCurrentTimestamp } from './time';

const CACHE_TTL_SECONDS = 3 * 60 * 60; // 3 hours

interface AudioCacheOptions {
  cacheDir: string;
}

/**
 * Generate cache file path for a given Ayah.
 * Convention: {cacheDir}/{reciterId}/{surah}_{ayah}.mp3
 */
export function buildCachePath(cacheDir: string, reciterId: string, surah: number, ayah: number): string {
  return `${cacheDir}/${reciterId}/${surah.toString().padStart(3, '0')}${ayah.toString().padStart(3, '0')}.mp3`;
}

/**
 * Check if a cache entry is still valid based on last accessed time.
 */
export function isCacheValid(entry: CacheEntry, now: Date = new Date()): boolean {
  const ageSeconds = (now.getTime() - entry.lastAccessed.getTime()) / 1000;
  return ageSeconds < entry.ttlSeconds;
}

/**
 * Create a CacheEntry metadata object.
 */
export function createCacheEntry(
  reciterId: string,
  surahNumber: number,
  ayahNumber: number,
  filePath: string,
  ttlSeconds: number = CACHE_TTL_SECONDS
): CacheEntry {
  return {
    reciterId,
    surahNumber,
    ayahNumber,
    filePath,
    lastAccessed: new Date(),
    ttlSeconds,
  };
}

/**
 * Abstract AudioCache class.
 * Platform-specific implementations should extend and provide actual file I/O.
 */
export abstract class AudioCache {
  protected cacheDir: string;
  protected entries: Map<string, CacheEntry>; // key: `${reciterId}:${surah}:${ayah}`

  constructor(options: AudioCacheOptions) {
    this.cacheDir = options.cacheDir;
    this.entries = new Map();
  }

  abstract initialize(): Promise<void>; // ensure cache dir exists, load existing entries

  abstract getCacheEntry(reciterId: string, surah: number, ayah: number): Promise<CacheEntry | null>;

  abstract saveToCache(reciterId: string, surah: number, ayah: number, data: Buffer | string): Promise<string>; // returns file path

  abstract cleanupStale(olderThanSeconds: number = CACHE_TTL_SECONDS): Promise<number>; // number of files deleted

  abstract clearAll(): Promise<void>;
}

/**
 * In-memory index utility (shared logic).
 */
export function buildCacheKey(reciterId: string, surah: number, ayah: number): string {
  return `${reciterId}:${surah}:${ayah}`;
}
