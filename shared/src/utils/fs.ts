// Platform-agnostic file system utilities
// These are pure path manipulation functions; actual I/O should be done by platform-specific services

/**
 * Resolve path segments with platform-specific separator.
 * In Node/Electron this uses path.join; in React Native use a polyfill or RNFS path methods.
 * This function is provided for convenience; platforms may replace with their own path library.
 */
export function resolvePath(...segments: string[]): string {
  // Simple join using forward slash; works for both platforms (RN normalizes)
  return segments.join('/').replace(/\/+/g, '/');
}

/**
 * Build output file name for completed video.
 * Format: {outputDir}/{timestamp}-S{surah}-A{start}-{end}-{reciter}.mp4
 */
export function buildOutputFileName(
  outputDir: string,
  surahNumber: number,
  ayahStart: number,
  ayahEnd: number,
  reciterName: string,
  ext: string = 'mp4'
): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const ayahRange = `${ayahStart}-${ayahEnd}`;
  const filename = `${timestamp}-S${surahNumber}-A${ayahRange}-${reciterName}.${ext}`;
  return resolvePath(outputDir, filename);
}

/**
 * Get the appropriate temporary directory for the platform.
 * This returns a string path; actual I/O must be performed by platform services.
 * - Desktop: OS temp directory (e.g., /tmp or %TEMP%)
 * - Mobile: Caches directory (RNFS.CachesDirectoryPath)
 */
export function getDefaultCacheDir(platform: 'desktop' | 'mobile'): string {
  if (platform === 'desktop') {
    // In Node/Electron, use os.tmpdir()
    // eslint-disable-next-line @typescript-eslintegration/no-require-imports
    const os = require('os');
    return require('path').join(os.tmpdir(), 'quran-shorts-cache');
  }
  // Mobile: React Native will provide actual path at runtime; return placeholder
  return 'file:///data/user/0/com.quranshortmaker/cache'; // Android typical; iOS will differ - platform service should override
}

/**
 * Convert a relative path to absolute if needed (no-op if already absolute).
 */
export function absolutePath(path: string): string {
  if (path.startsWith('/') || path.match(/^[a-zA-Z]:\\/)) {
    return path;
  }
  return resolvePath(process.cwd(), path);
}

/**
 * Ensure a directory exists.
 * This is a NO-OP in shared code; platform-specific services should implement actual directory creation.
 */
export function ensureDirSync(_dir: string): void {
  // Do nothing; intended to be overridden by platform-specific file service
}

/**
 * Check if a file exists.
 * This always returns false in shared code; platform-specific services should implement actual check.
 */
export function fileExists(_filePath: string): boolean {
  return false;
}
