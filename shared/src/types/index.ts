// Core TypeScript interfaces for Quran Short Maker
// Generated from data-model.md

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
  duration?: number; // computed after audio probe
}

export interface Reciter {
  id: string;
  name: string;
  language: string;
  style?: string;
  sampleAudioUrl: string;
}

export type VideoSourceType = "upload" | "stock";

export interface VideoSource {
  sourceType: VideoSourceType;
  filePath?: string; // for upload
  stockUrl?: string; // for stock
  originalWidth: number;
  originalHeight: number;
  duration: number;
  format: string; // e.g., "mp4"
}

export type SubtitleColor = "white" | "yellow" | "black_outline";
export type SubtitlePosition = "top" | "middle" | "bottom";

export interface SubtitleConfig {
  enabled: boolean;
  fontSize: number; // 24-72
  color: SubtitleColor;
  position: SubtitlePosition;
  showTranslation: boolean;
  translationFontSize: number; // 12-36
}

export type RenderJobStatus = "queued" | "processing" | "completed" | "failed";

export interface RenderJob {
  id: string; // UUID
  status: RenderJobStatus;
  surahNumber: number;
  ayahRangeStart: number;
  ayahRangeEnd: number;
  reciterId: string;
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
  ttlSeconds: number; // 10800 = 3 hours
}

// Helper type for aspect ratio dimensions
export interface AspectRatioDimensions {
  width: number;
  height: number;
}
