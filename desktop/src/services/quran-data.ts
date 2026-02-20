// Quran data service
// Manages Surah and Ayah metadata with caching

import { Surah, Ayah, Reciter } from '../types';
import { getChapters, getVersesByChapter, getReciters } from '../api/quran-client';

class QuranDataService {
  private surahs: Surah[] = [];
  private reciters: Reciter[] = [];
  private cache: Map<string, Ayah[]> = new Map();

  async loadSurahs(): Promise<Surah[]> {
    if (this.surahs.length === 0) {
      this.surahs = await getChapters('en');
    }
    return this.surahs;
  }

  async loadReciters(): Promise<Reciter[]> {
    if (this.reciters.length === 0) {
      this.reciters = await getReciters('en');
    }
    return this.reciters;
  }

  async getAyahs(surahNumber: number, start: number, end: number): Promise<Ayah[]> {
    const cacheKey = `${surahNumber}:${start}-${end}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const ayahs = await getVersesByChapter(surahNumber, 'en', `${start}-${end}`);
    this.cache.set(cacheKey, ayahs);
    return ayahs;
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const quranDataService = new QuranDataService();
