// Type definitions for shared package
// Temporary local definitions to resolve import issues

export type RevelationType = "Meccan" | "Medinan";

export interface Surah {
  number: number;
  arabicName: string;
  englishName: string;
  revelationType: RevelationType;
  totalAyahs: number;
}

export interface Ayah {
  surahNumber: number;
  number: number;
  arabicText: string;
  englishTranslation?: string;
  duration?: number;
}

export interface Reciter {
  id: string;
  name: string;
  language: string;
  style?: string;
  sampleAudioUrl: string;
  slug: string; // for building audio URLs
}

export type VideoSourceType = "upload" | "stock";

export interface VideoSource {
  sourceType: VideoSourceType;
  filePath?: string;
  stockUrl?: string;
  originalWidth: number;
  originalHeight: number;
  duration: number;
  format: string;
}

export type SubtitleColor = "white" | "yellow" | "black_outline";
export type SubtitlePosition = "top" | "middle" | "bottom";

export interface SubtitleConfig {
  enabled: boolean;
  fontSize: number;
  color: SubtitleColor;
  position: SubtitlePosition;
  showTranslation: boolean;
  translationFontSize: number;
}

export type RenderJobStatus = "queued" | "processing" | "completed" | "failed";

export interface RenderJob {
  id: string;
  status: RenderJobStatus;
  surahNumber: number;
  ayahRangeStart: number;
  ayahRangeEnd: number;
  reciterId: string;
  reciterSlug: string; // for building audio URLs
  videoSource: VideoSource;
  subtitleConfig: SubtitleConfig;
  aspectRatio: "9:16" | "1:1" | "4:5" | "16:9";
  outputFilePath?: string;
  processingTime?: number;
  errorMessage?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface CacheEntry {
  reciterId: string;
  surahNumber: number;
  ayahNumber: number;
  filePath: string;
  lastAccessed: Date;
  ttlSeconds: number;
}

export interface AspectRatioDimensions {
  width: number;
  height: number;
}
